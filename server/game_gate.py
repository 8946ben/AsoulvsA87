# -*- coding: utf-8 -*-
"""A-SOUL vs A87 网页版入场券服务：限制最大同时在线人数。

- 只监听 127.0.0.1，外部一律经 nginx `location /game/api/` 反代访问，不出公网；
- 纯标准库、内存态、无持久化；服务重启即清零，客户端会自动重新领票；
- 每个标签页一个名额：领票后需心跳续租，关闭/刷新页面时客户端 sendBeacon 立即释放，
  异常关闭（崩溃/断网）由租约超时自动释放。

端点（GET/POST 等价，参数走 query）：
  /api/status                -> {"ok":true,"online":n,"max":3}
  /api/acquire?cid=xxx       -> 领票；200 {"ok":true,"token":...} / 满员 429 {"ok":false,"reason":"full",...}
  /api/heartbeat?token=xxx   -> 续租；200 / 票据不存在 404 {"ok":false,"reason":"expired"}
  /api/release?token=xxx     -> 释放名额
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

_lock = threading.Lock()
_leases = {}  # token -> {"cid": str, "last": float}


def _sweep():
    """清理超过租约未心跳的票据。调用方需持有 _lock。"""
    now = time.time()
    for token in [t for t, v in _leases.items() if now - v["last"] > LEASE_SECONDS]:
        _leases.pop(token, None)


class Handler(BaseHTTPRequestHandler):
    server_version = "GameGate/1.0"

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _route(self):
        url = urlparse(self.path)
        qs = parse_qs(url.query)

        def get1(key):
            return (qs.get(key) or [""])[0]

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
            self._json(200, {"service": "game-gate", "online": online,
                             "max": MAX_SLOTS, "lease": LEASE_SECONDS})
        else:
            self._json(404, {"ok": False, "reason": "not-found"})

    def do_GET(self):
        self._route()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 0:
            self.rfile.read(min(length, 65536))  # 丢弃请求体，参数一律走 query
        self._route()

    def log_message(self, fmt, *args):
        print("[gate]", self.address_string(), fmt % args, flush=True)


if __name__ == "__main__":
    print(f"game-gate listening on {HOST}:{PORT}, max_slots={MAX_SLOTS}, lease={LEASE_SECONDS}s", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
