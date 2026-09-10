# -*- coding: utf-8 -*-
"""把 dist/ 的网页版发布到阿里云 ECS 的 nginx 子路径 /game/。

用法：
    python scripts/publish-web.py            # 上传 dist/ 并确保 nginx /game/ 配置就位
    python scripts/publish-web.py --build    # 先执行 npm run build 再发布
    python scripts/publish-web.py --config-only  # 只同步 nginx /game/ 配置，不上传文件

行为说明：
- 服务器目录：/opt/game/（只写这个新目录，不碰 /opt/novel、/opt/xujie 等现有站点）。
- nginx 配置：/etc/nginx/sites-available/xujie 的 443 server 块内插入/替换一段
  由标记 `# >>> asoul-game` ... `# <<< asoul-game <<<` 包裹的 location 片段，幂等可重复执行。
- 每次修改配置前都会先备份为 sites-available/xujie.bak-asoul-<时间戳>；
  `nginx -t` 失败会自动还原备份且不 reload。
- 本机依赖：paramiko；root 密码沿用 D:\\waw\\novel-site\\server-credentials.txt。
- 部署后访问：https://47.114.37.80/game/
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

import paramiko

HOST = "47.114.37.80"
REMOTE_DIR = "/opt/game"
SITE_FILE = "/etc/nginx/sites-available/xujie"
CRED_FILE = Path(r"D:\waw\novel-site\server-credentials.txt")
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
MARK_BEGIN = "# >>> asoul-game (managed by scripts/publish-web.py) >>>"
MARK_END = "# <<< asoul-game <<<"

# 位置说明：插到 443 server 块的 `location /`（proxy_pass 那个）之前，
# 前缀匹配天然优先于反代规则。缓存策略：index 5 分钟、哈希产物 1 年 immutable、图片 1 天。
NGINX_SNIPPET = f"""{MARK_BEGIN}
    # A-SOUL vs A87 网页版（由 scripts/publish-web.py 管理，可整段删除回退）
    location = /game {{ return 301 /game/; }}
    location /game/ {{
        root /opt;
        index index.html;
        try_files $uri $uri/ =404;
        expires 5m;
    }}
    location ~* ^/game/assets/.+\\.(js|css)$ {{
        root /opt;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }}
    location ~* ^/game/images/.+\\.(png|jpg|jpeg|webp|gif|svg)$ {{
        root /opt;
        expires 1d;
    }}
{MARK_END}
"""


def load_password() -> str:
    cred = dict(line.split(": ", 1) for line in
                CRED_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
                if ": " in line)
    return cred["password"]


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 120) -> tuple[int, str]:
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    text = out.read().decode("utf-8", "replace")
    errtext = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    return code, (text + errtext).strip()


def main() -> int:
    if "--build" in sys.argv:
        print("== npm run build ==")
        build = subprocess.run(["npm", "run", "build"], cwd=str(DIST_DIR.parent))
        if build.returncode != 0:
            print("build 失败，终止发布")
            return 1
    if not (DIST_DIR / "index.html").is_file():
        print("缺少 dist/index.html，请先运行 python scripts/publish-web.py --build")
        return 1

    files = [] if "--config-only" in sys.argv else sorted(p for p in DIST_DIR.rglob("*") if p.is_file())
    total_mb = sum(p.stat().st_size for p in files) / 1048576
    print(f"待上传 {len(files)} 个文件，共 {total_mb:.1f} MB")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username="root", password=load_password(),
                timeout=60, banner_timeout=60, auth_timeout=60)

    code, out = run(ssh, f"mkdir -p {REMOTE_DIR}")
    if code != 0:
        print("创建远端目录失败：", out)
        return 1
    subdirs = sorted({p.relative_to(DIST_DIR).parent.as_posix() for p in files} - {"."})
    if subdirs:
        code, out = run(ssh, "mkdir -p " + " ".join(f"{REMOTE_DIR}/{d}" for d in subdirs))
        if code != 0:
            print("创建远端子目录失败：", out)
            return 1

    sftp = ssh.open_sftp()
    t0 = time.time()
    done = 0
    for p in files:
        rel = p.relative_to(DIST_DIR).as_posix()
        remote = f"{REMOTE_DIR}/{rel}"
        sftp.put(str(p), remote)
        done += p.stat().st_size
        print(f"  up {rel}  {done / 1048576:5.1f}/{total_mb:.1f} MB")
    print(f"上传完成，用时 {time.time() - t0:.0f}s")

    code, out = run(ssh, f"cat {SITE_FILE}")
    if code != 0:
        print("读取 nginx 配置失败：", out)
        return 1
    conf = out

    anchor = "    location / {\n        proxy_pass"
    if MARK_BEGIN in conf:
        head = conf.split(MARK_BEGIN, 1)[0]
        tail = conf.split(MARK_END, 1)[1]
        new_conf = head + NGINX_SNIPPET + tail
        action = "替换既有标记段"
    elif anchor in conf:
        new_conf = conf.replace(anchor, NGINX_SNIPPET + anchor, 1)
        action = "插入新片段"
    else:
        print("未找到插入锚点（location / + proxy_pass），不改动服务器")
        return 1

    stamp = time.strftime("%Y%m%d-%H%M%S")
    backup = f"{SITE_FILE}.bak-asoul-{stamp}"
    code, out = run(ssh, f"cp -a {SITE_FILE} {backup} && echo OK")
    if code != 0 or "OK" not in out:
        print("备份失败，不改动服务器：", out)
        return 1

    with sftp.open(SITE_FILE, "w") as f:
        f.write(new_conf)
    print(f"nginx 配置{action}，备份：{backup}")

    code, out = run(ssh, "nginx -t 2>&1")
    print(out)
    if code != 0:
        run(ssh, f"cp -a {backup} {SITE_FILE}")
        code2, out2 = run(ssh, "nginx -t 2>&1")
        print("nginx -t 失败，已还原备份（未 reload）。还原后 nginx -t：", out2)
        return 1

    code, out = run(ssh, "systemctl reload nginx && systemctl is-active nginx")
    print("reload nginx:", out)
    if code != 0:
        print("reload 失败，请登录服务器检查（配置文件已通过 nginx -t）")
        return 1

    import ssl
    import urllib.request
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    url = f"https://{HOST}/game/"
    with urllib.request.urlopen(url, context=ctx, timeout=30) as resp:
        body = resp.read().decode("utf-8", "replace")
        print("线上检查:", url, resp.status, "index" if "assets/index-" in body else "内容异常!")
    sftp.close()
    ssh.close()
    print("PUBLISHED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
