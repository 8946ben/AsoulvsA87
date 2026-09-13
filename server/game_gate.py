# -*- coding: utf-8 -*-
"""枝江舞台保卫战 网页版后端：入场券限流 + 玩家意见反馈。

- 只监听 127.0.0.1，外部一律经 nginx `location /game/api/` 反代访问，不出公网；
- 入场券为内存态、无持久化，服务重启即清零，客户端会自动重新领票；
- 意见反馈追加写入 JSONL 文件（`GAME_FEEDBACK_LOG`，默认 /opt/game-gate/feedback.jsonl），
  服务器上直接 `tail -n 20 /opt/game-gate/feedback.jsonl` 即可阅读，一行一条。

端点（入场券 GET/POST 等价，参数走 query）：
  /api/status                -> {"ok":true,"online":n,"max":3}
  /api/acquire?cid=xxx       -> 领票；200 {"ok":true,"token":...} / 满员 429 {"ok":false,"reason":"full",...}
  /api/heartbeat?token=xxx   -> 续租；200 / 票据不存在 404 {"ok":false,"reason":"expired"}
  /api/release?token=xxx     -> 释放名额
  /api/feedback              -> POST 提交建议（JSON 或表单：id/content/contact/cid）
                                200 {"ok":true,"id":...,"count":n}；内容为空 400；
                                提交过于频繁 429；写盘失败 500
                                GET  只返回 {"ok":true,"count":n}，不回放内容——
                                公网可访问该路径，不能让别人读到其他人的反馈。
"""
import json
import os
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HOST = "127.0.0.1"
PORT = int(os.environ.get("GAME_GATE_PORT", "8793"))
MAX_SLOTS = int(os.environ.get("GAME_MAX_SLOTS", "3"))
LEASE_SECONDS = float(os.environ.get("GAME_LEASE_SECONDS", "120"))

FEEDBACK_LOG = os.environ.get("GAME_FEEDBACK_LOG", "/opt/game-gate/feedback.jsonl")
FEEDBACK_MAX_CHARS = int(os.environ.get("GAME_FEEDBACK_MAX_CHARS", "500"))
FEEDBACK_COOLDOWN = float(os.environ.get("GAME_FEEDBACK_COOLDOWN", "10"))
# 记住最近这么多条反馈的 id，客户端补交时用来去重（超时重发不会重复入库）。
FEEDBACK_DEDUPE_WINDOW = 500

_lock = threading.Lock()
_leases = {}  # token -> {"cid": str, "last": float}

_fb_lock = threading.Lock()
_fb_last = {}  # cid/ip -> 上次提交时间，用于限频
_fb_ids = set()  # 已落库的反馈 id
_fb_count = 0


def _sweep():
    """清理超过租约未心跳的票据。调用方需持有 _lock。"""
    now = time.time()
    for token in [t for t, v in _leases.items() if now - v["last"] > LEASE_SECONDS]:
        _leases.pop(token, None)


def _load_feedback_index():
    """启动时统计已有反馈条数，并记住最近若干条 id 供补交去重。"""
    global _fb_count
    if not os.path.exists(FEEDBACK_LOG):
        return
    lines = []
    try:
        with open(FEEDBACK_LOG, "r", encoding="utf-8", errors="replace") as f:
            lines = [line for line in (row.strip() for row in f) if line]
    except OSError as exc:
        print("[feedback] 读取历史反馈失败:", exc, flush=True)
        return
    _fb_count = len(lines)
    for line in lines[-FEEDBACK_DEDUPE_WINDOW:]:
        try:
            rid = json.loads(line).get("id")
        except ValueError:
            continue
        if rid:
            _fb_ids.add(str(rid)[:64])


def _append_feedback(record):
    """追加一行 JSON 并 flush 落盘。调用方需持有 _fb_lock。"""
    global _fb_count
    directory = os.path.dirname(FEEDBACK_LOG)
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(FEEDBACK_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
        f.flush()
    _fb_count += 1


def _clean(value, limit):
    """去掉控制字符（保留换行）并裁剪到上限。"""
    text = "".join(ch for ch in str(value) if ch == "\n" or ch >= " ")
    return text.strip()[:limit]


class Handler(BaseHTTPRequestHandler):
    server_version = "GameGate/1.1"
    _body = b""

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self):
        # 经 nginx 反代后，真实来源在 X-Forwarded-For 的第一段。
        forwarded = self.headers.get("X-Forwarded-For") or ""
        if forwarded:
            return forwarded.split(",")[0].strip()[:64]
        return self.client_address[0] if self.client_address else "unknown"

    def _feedback_params(self, qs):
        """请求体优先（JSON → 表单），缺失字段再退回 query。"""
        data = {}
        raw = self._body or b""
        if raw:
            try:
                parsed = json.loads(raw.decode("utf-8", "replace"))
                if isinstance(parsed, dict):
                    data.update(parsed)
            except ValueError:
                try:
                    for key, values in parse_qs(raw.decode("utf-8", "replace")).items():
                        data[key] = values[-1]
                except (ValueError, UnicodeDecodeError):
                    pass
        for key in ("id", "content", "contact", "cid"):
            if not data.get(key) and qs.get(key):
                data[key] = qs[key][0]
        return data

    def _handle_feedback(self, url, qs):
        """处理 /api/feedback；命中该路径返回 True，否则返回 False 交回主路由。"""
        if url.path != "/api/feedback":
            return False

        if self.command == "GET":
            with _fb_lock:
                self._json(200, {"ok": True, "count": _fb_count})
            return True

        params = self._feedback_params(qs)
        content = _clean(params.get("content", ""), FEEDBACK_MAX_CHARS)
        if not content:
            self._json(400, {"ok": False, "reason": "empty", "message": "反馈内容不能为空"})
            return True

        rid = _clean(params.get("id", ""), 64) or secrets.token_hex(8)
        contact = _clean(params.get("contact", ""), 80)
        cid = _clean(params.get("cid", ""), 64)
        ip = self._client_ip()

        with _lock:
            online = len(_leases)

        with _fb_lock:
            if rid in _fb_ids:
                self._json(200, {"ok": True, "id": rid, "duplicate": True, "count": _fb_count})
                return True

            key = cid or ip
            now = time.time()
            last = _fb_last.get(key)
            if last is not None and now - last < FEEDBACK_COOLDOWN:
                wait = int(FEEDBACK_COOLDOWN - (now - last)) + 1
                self._json(429, {"ok": False, "reason": "too-fast",
                                 "message": f"提交太频繁，请 {wait} 秒后再试"})
                return True
            _fb_last[key] = now
            if len(_fb_last) > 5000:  # 简单清理，避免长期运行后字典无限增长
                for stale in [k for k, v in _fb_last.items() if now - v > 86400]:
                    _fb_last.pop(stale, None)

        record = {
            "id": rid,
            "ts": round(time.time(), 3),
            "time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content": content,
            "contact": contact,
            "cid": cid,
            "ip": ip,
            "ua": (self.headers.get("User-Agent") or "")[:200],
            "online": online,
        }

        try:
            with _fb_lock:
                _append_feedback(record)
                _fb_ids.add(rid)
        except OSError as exc:
            print("[feedback] 写入失败:", exc, flush=True)
            self._json(500, {"ok": False, "reason": "io", "message": "服务器写入失败，请稍后重试"})
            return True

        print(f"[feedback] {record['time']} {ip} {len(content)}字 {content[:60]!r}", flush=True)
        self._json(200, {"ok": True, "id": rid, "count": _fb_count})
        return True

    def _route(self):
        url = urlparse(self.path)
        qs = parse_qs(url.query)

        def get1(key):
            return (qs.get(key) or [""])[0]

        if self._handle_feedback(url, qs):
            return

        if url.path == "/api/status":
            with _lock:
                _sweep()
                self._json(200, {"ok": True, "online": len(_leases), "max": MAX_SLOTS})
        elif url.path == "/api/acquire":
            cid = get1("cid")[:64]
            with _lock:
                _sweep()
                if len(_leases) >= MAX_SLOTS:
                    self._json(429, {"ok": False, "reason": "full",
                                     "online": len(_leases), "max": MAX_SLOTS, "retry": 5})
                    return
                token = secrets.token_hex(16)
                _leases[token] = {"cid": cid, "last": time.time()}
                self._json(200, {"ok": True, "token": token,
                                 "online": len(_leases), "max": MAX_SLOTS, "lease": LEASE_SECONDS})
        elif url.path == "/api/heartbeat":
            token = get1("token")
            with _lock:
                _sweep()
                info = _leases.get(token)
                if info is None:
                    self._json(404, {"ok": False, "reason": "expired",
                                     "online": len(_leases), "max": MAX_SLOTS})
                    return
                info["last"] = time.time()
                self._json(200, {"ok": True, "online": len(_leases), "max": MAX_SLOTS})
        elif url.path == "/api/release":
            token = get1("token")
            with _lock:
                existed = _leases.pop(token, None) is not None
            self._json(200, {"ok": True, "released": existed})
        elif url.path == "/":
            with _lock:
                _sweep()
                online = len(_leases)
            with _fb_lock:
                feedback = _fb_count
            self._json(200, {"service": "game-gate", "online": online,
                             "max": MAX_SLOTS, "lease": LEASE_SECONDS, "feedback": feedback})
        else:
            self._json(404, {"ok": False, "reason": "not-found"})

    def do_GET(self):
        self._body = b""
        self._route()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        # 反馈正文走请求体，其余端点参数一律走 query；上限 64KB 足够容纳反馈文本。
        self._body = self.rfile.read(min(length, 65536)) if length > 0 else b""
        self._route()

    def log_message(self, fmt, *args):
        print("[gate]", self.address_string(), fmt % args, flush=True)


if __name__ == "__main__":
    _load_feedback_index()
    print(f"game-gate listening on {HOST}:{PORT}, max_slots={MAX_SLOTS}, lease={LEASE_SECONDS}s", flush=True)
    print(f"feedback log: {FEEDBACK_LOG} (已有 {_fb_count} 条)", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
