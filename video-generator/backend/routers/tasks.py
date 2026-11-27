"""Task management endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task, ApiConfig
from ..adapters.providers import get_adapter

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
                    task.video_url = result.video_url
                    task.completed_at = datetime.utcnow()
                elif result.status == "failed":
                    task.status = "failed"
                    task.error_message = result.error
                    task.completed_at = datetime.utcnow()
                db.commit()
                db.refresh(task)

    return _to_dict(task)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")
    db.delete(task)
    db.commit()
    return {"deleted": True}


@router.get("/videos/{task_id}")
async def get_video(task_id: str, db: Session = Depends(get_db)):
    """Serve video file."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or not task.video_url:
        raise HTTPException(404, "video not found")

    # If it's a local file path
    if task.video_url.startswith("/"):
        return FileResponse(task.video_url)
    # If it's a remote URL, return it as-is for the frontend
    return {"video_url": task.video_url}


def _to_dict(task: Task) -> dict:
    return {
        "id": task.id, "prompt": task.prompt, "provider": task.provider,
        "model": task.model or "", "params": task.params or {},
        "status": task.status, "video_url": task.video_url or "",
        "error_message": task.error_message or "", "duration": task.duration or 0,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }
