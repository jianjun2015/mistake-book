"""Video file service — persist provider videos locally.

厂商返回的视频 URL 均为短时效（Runway 签名 URL、Seedance 24h/限次下载），
任务完成时立即转存到 data/videos/，前端只访问本地服务端点。
"""

import logging
from pathlib import Path

import httpx

from ..database import VIDEO_DIR

logger = logging.getLogger(__name__)


def is_remote_url(url: str) -> bool:
    return url.startswith("http://") or url.startswith("https://")


# 部分 CDN 会拦截无 UA 的请求，必须带上浏览器 UA
_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def download_video(url: str, task_id: str, timeout: float = 120.0, retries: int = 2) -> str:
    """Download a generated video to local storage. Returns local path or "".

    厂商/示例 CDN 常有防盗链或瞬时失败，因此带浏览器 UA 并重试若干次。
    """
    if not is_remote_url(url):
        return ""
    dest = VIDEO_DIR / f"{task_id}.mp4"
    headers = {"User-Agent": _UA, "Accept": "*/*"}
    for attempt in range(retries + 1):
        try:
            with httpx.stream("GET", url, timeout=timeout, follow_redirects=True,
                              headers=headers) as resp:
                if resp.status_code != 200:
                    logger.warning("download failed task=%s http=%s attempt=%s",
                                   task_id, resp.status_code, attempt)
                    continue
                with open(dest, "wb") as f:
                    for chunk in resp.iter_bytes():
                        f.write(chunk)
            if dest.stat().st_size > 0:
                return str(dest)
        except Exception as e:  # noqa: BLE001 — download is best-effort
            logger.warning("download failed task=%s attempt=%s: %s", task_id, attempt, e)
    return ""


def local_video_path(task_id: str) -> Path:
    return VIDEO_DIR / f"{task_id}.mp4"
