"""Task management endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task, ApiConfig
from ..adapters.providers import get_adapter
from ..services.video_service import download_video, is_remote_url, local_video_path

router = APIRouter()


@router.get("/tasks")
async def list_tasks(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """List tasks with pagination."""
    total = db.query(Task).count()
    tasks = db.query(Task).order_by(Task.created_at.desc()).offset((page-1)*size).limit(size).all()
    return {
        "tasks": [_to_dict(t) for t in tasks],
        "total": total, "page": page, "size": size,
    }


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get task detail + poll provider status."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    # Poll provider if still processing
    if task.status == "processing":
        provider_task_id = (task.params or {}).get("provider_task_id", "")
        if provider_task_id:
            config = db.query(ApiConfig).filter(ApiConfig.provider == task.provider).first()
            if config and config.api_key:
                adapter = get_adapter(task.provider, config.api_key, config.base_url)
                result = adapter.query(provider_task_id)
                if result.status == "completed":
                    task.status = "completed"
                    task.completed_at = datetime.utcnow()
                    task.duration = _elapsed(task)
                    video_url = result.video_url
                    # 厂商 URL 短时效 —— 完成后立即转存本地，前端走稳定的服务端点
                    if is_remote_url(video_url):
                        local = download_video(video_url, task.id)
                        if local:
                            params = dict(task.params or {})
                            params["source_url"] = video_url
                            task.params = params
                            video_url = f"/api/videos/{task.id}"
                    task.video_url = video_url
                elif result.status == "failed":
                    task.status = "failed"
                    task.error_message = result.error
                    task.completed_at = datetime.utcnow()
                    task.duration = _elapsed(task)
                db.commit()
                db.refresh(task)

    return _to_dict(task)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")
    local = local_video_path(task_id)
    if local.exists():
        local.unlink()
    db.delete(task)
    db.commit()
    return {"deleted": True}


@router.get("/videos/{task_id}")
async def get_video(task_id: str, db: Session = Depends(get_db)):
    """Serve video file (local persisted copy first, remote fallback)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or not task.video_url:
        raise HTTPException(404, "video not found")

    local = local_video_path(task_id)
    if local.exists():
        return FileResponse(local, media_type="video/mp4", filename=f"{task_id}.mp4")
    params = task.params or {}
    source = params.get("source_url", "")
    if is_remote_url(source):
        return RedirectResponse(source)
    if is_remote_url(task.video_url):
        return RedirectResponse(task.video_url)
    if task.video_url.startswith("/"):
        return FileResponse(task.video_url, media_type="video/mp4")
    raise HTTPException(404, "video not found")


def _elapsed(task: Task) -> float:
    if task.created_at and task.completed_at:
        return round((task.completed_at - task.created_at).total_seconds(), 1)
    return 0.0


def _to_dict(task: Task) -> dict:
    return {
        "id": task.id, "prompt": task.prompt, "provider": task.provider,
        "model": task.model or "", "params": task.params or {},
        "status": task.status, "video_url": task.video_url or "",
        "error_message": task.error_message or "", "duration": task.duration or 0,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }
