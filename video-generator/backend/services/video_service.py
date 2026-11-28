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


def download_video(url: str, task_id: str, timeout: float = 120.0) -> str:
    """Download a generated video to local storage. Returns local path or ""."""
    if not is_remote_url(url):
        return ""
    dest = VIDEO_DIR / f"{task_id}.mp4"
    try:
        with httpx.stream("GET", url, timeout=timeout, follow_redirects=True) as resp:
            if resp.status_code != 200:
                logger.warning("download failed task=%s http=%s", task_id, resp.status_code)
                return ""
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes():
                    f.write(chunk)
        return str(dest)
    except Exception as e:  # noqa: BLE001 — download is best-effort
        logger.warning("download failed task=%s: %s", task_id, e)
        return ""


def local_video_path(task_id: str) -> Path:
    return VIDEO_DIR / f"{task_id}.mp4"
