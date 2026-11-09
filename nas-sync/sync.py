"""
jkeroro.com NAS 自动换图

每天定时（config.toml 里的 sync_time）跑一次：
- [[slot]]：从指定文件夹随机挑一张（最近用过的尽量避开），压缩后推到网站，换掉首页对应 caption 的那一格
- [anniversary]：把文件夹镜像到纪念日轮播 —— 文件夹里新加的推上去，删掉的从网站移除
  （只动由 NAS 推上去的照片，后台手动传的不碰）

只有 NAS 主动往外连网站，不需要开端口、不需要把 NAS 暴露到公网。
手动立刻跑一次：docker exec jkeroro-nas-sync python /app/sync.py --once
"""

import hashlib
import io
import json
import os
import random
import sys
import time
import tomllib
from datetime import datetime, timedelta
from pathlib import Path

import requests
from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()  # iPhone 的 HEIC 照片
except ImportError:
    pass

CONFIG_PATH = Path(os.environ.get("CONFIG_PATH", "/app/config.toml"))
STATE_PATH = Path(os.environ.get("STATE_PATH", "/app/state/state.json"))
TOKEN = os.environ.get("NAS_SYNC_TOKEN", "")

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
MAX_SIDE = 2000
QUALITY = 82
RECENT_KEEP = 30


def log(*args):
    print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), *args, flush=True)


# ---------- 照片文件 ----------

def list_photos(folder: Path) -> list[Path]:
    """递归列出文件夹里的照片，跳过隐藏文件、NAS 的缩略图/回收站文件夹"""
    out = []
    for root, dirs, files in os.walk(folder):
        dirs[:] = [d for d in dirs if not d.startswith((".", "@", "#")) and d.lower() != "recycle"]
        for f in files:
            if f.startswith(".") or Path(f).suffix.lower() not in PHOTO_EXT:
                continue
            out.append(Path(root) / f)
    return sorted(out)


def file_hash(path: Path, cache: dict) -> str:
    """照片内容的 hash（缓存在 state 里，文件没改过就不重新算）"""
    st = path.stat()
    key = str(path)
    hit = cache.get(key)
    if hit and hit["mtime"] == st.st_mtime and hit["size"] == st.st_size:
        return hit["hash"]
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    digest = h.hexdigest()[:32]
    cache[key] = {"mtime": st.st_mtime, "size": st.st_size, "hash": digest}
    return digest


def encode(path: Path) -> tuple[bytes, int, int]:
    """摆正方向 → 长边缩到 2000 → WebP"""
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=QUALITY, method=4)
        return buf.getvalue(), im.width, im.height


# ---------- 网站接口 ----------

class Site:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.s = requests.Session()
        self.s.headers["Authorization"] = f"Bearer {TOKEN}"
        self.s.headers["User-Agent"] = "jkeroro-nas-sync/1.0"

    def req(self, method: str, path: str, **kw):
        for attempt in range(4):
            r = self.s.request(method, self.base + path, timeout=60, **kw)
            if r.status_code == 429 and attempt < 3:
                wait = min(int(r.headers.get("Retry-After", "10") or 10), 60)
                log(f"  被限流，等 {wait}s")
                time.sleep(wait)
                continue
            if r.status_code >= 400:
                try:
                    msg = r.json().get("error")
                except Exception:
                    msg = r.text[:200]
                raise RuntimeError(f"{method} {path} → {r.status_code}: {msg}")
            return r.json()
        raise RuntimeError(f"{method} {path} 一直被限流")

    def push(self, path: str, photo: Path, digest: str, extra: dict | None = None):
        data, w, h = encode(photo)
        fields = {"hash": digest, "width": str(w), "height": str(h), **(extra or {})}
        return self.req("POST", path, data=fields, files={"file": (f"{digest}.webp", data, "image/webp")})


# ---------- 同步 ----------

def sync_slots(site: Site, cfg: dict, state: dict):
    slots = cfg.get("slot", [])
    if not slots:
        return
    targets = site.req("GET", "/api/nas/targets")["slots"]
    by_caption = {t["caption"].strip().lower(): t["id"] for t in targets if t["caption"]}
    recent_all = state.setdefault("recent", {})

    for slot in slots:
        name = slot.get("caption") or slot.get("id")
        target = slot.get("id") or by_caption.get(str(slot.get("caption", "")).strip().lower())
        if not target:
            log(f"[slot] 找不到 caption 为「{name}」的照片，检查后台 Images 里的 caption")
            continue
        folder = Path(slot["folder"])
        photos = list_photos(folder) if folder.is_dir() else []
        if not photos:
            log(f"[slot] {name}: 文件夹 {folder} 里没有照片，跳过")
            continue

        cache = state.setdefault("hashes", {})
        recent = recent_all.get(name, [])
        keep = min(RECENT_KEEP, len(photos) - 1)
        avoid = set(recent[:keep]) if keep > 0 else set()
        random.shuffle(photos)
        for p in photos:
            try:
                digest = file_hash(p, cache)
                if digest in avoid:
                    continue
                site.push("/api/nas/slot", p, digest, {"target": target})
                recent_all[name] = [digest] + [d for d in recent if d != digest][: RECENT_KEEP - 1]
                log(f"[slot] {name}: 换成 {p.name}（文件夹里共 {len(photos)} 张）")
                break
            except Exception as e:  # 这张打不开 / 推送失败，换下一张
                log(f"[slot] {name}: {p.name} 失败：{e}")
        else:
            log(f"[slot] {name}: 没有能用的照片")


def sync_anniversary(site: Site, cfg: dict, state: dict):
    ann = cfg.get("anniversary")
    if not ann:
        return
    folder = Path(ann["folder"])
    photos = list_photos(folder) if folder.is_dir() else []
    # 文件夹不存在 / 是空的（比如硬盘没挂载上）时，绝不删网站上的照片
    if not photos:
        log(f"[anniversary] 文件夹 {folder} 里没有照片，这次跳过（不会删网站上的照片）")
        return

    cache = state.setdefault("hashes", {})
    local: dict[str, Path] = {}
    for p in photos:
        try:
            local.setdefault(file_hash(p, cache), p)
        except OSError as e:
            log(f"[anniversary] 读不了 {p}: {e}")

    remote_urls = site.req("GET", "/api/nas/anniversary")["urls"]
    remote = {Path(u.split("?")[0]).stem: u for u in remote_urls}

    added = 0
    for digest, p in local.items():
        if digest in remote:
            continue
        try:
            site.push("/api/nas/anniversary", p, digest)
            added += 1
            time.sleep(0.6)
        except Exception as e:
            log(f"[anniversary] {p.name} 失败：{e}")

    gone = [u for d, u in remote.items() if d not in local]
    if gone:
        site.req("DELETE", "/api/nas/anniversary", json={"urls": gone})
    log(f"[anniversary] 文件夹 {len(local)} 张：新加 {added}，移除 {len(gone)}")


def run_once():
    cfg = tomllib.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    state = json.loads(STATE_PATH.read_text()) if STATE_PATH.exists() else {}
    site = Site(cfg["site"])
    log("开始同步", cfg["site"])
    for step in (sync_slots, sync_anniversary):
        try:
            step(site, cfg, state)
        except Exception as e:
            log(f"{step.__name__} 出错：{e}")
    # 只保留还存在的文件的 hash 缓存
    state["hashes"] = {k: v for k, v in state.get("hashes", {}).items() if Path(k).exists()}
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False))
    log("同步结束")


def seconds_until(hhmm: str) -> float:
    h, m = (int(x) for x in hhmm.split(":"))
    now = datetime.now()
    nxt = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if nxt <= now:
        nxt += timedelta(days=1)
    return (nxt - now).total_seconds()


def main():
    if len(TOKEN) < 32:
        sys.exit("缺少 NAS_SYNC_TOKEN 环境变量")
    if "--once" in sys.argv:
        run_once()
        return
    cfg = tomllib.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    sync_time = cfg.get("sync_time", "04:00")
    if cfg.get("run_on_start", True):
        run_once()
    while True:
        wait = seconds_until(sync_time)
        log(f"下次同步：{sync_time}（{wait / 3600:.1f} 小时后）")
        time.sleep(wait)
        run_once()


if __name__ == "__main__":
    main()
