"""Generate endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task, ApiConfig
from ..schemas import GenerateRequest, TaskResponse
from ..adapters.providers import ADAPTERS, get_adapter
from ..services.video_service import download_video, is_remote_url

router = APIRouter()


@router.post("/generate", response_model=TaskResponse)
async def generate_video(req: GenerateRequest, db: Session = Depends(get_db)):
    """Submit a video generation task."""
    if req.provider not in ADAPTERS:
        raise HTTPException(400, f"未知厂商: {req.provider}")

    # Get API config (mock mode bypasses key check)
    is_mock = req.provider == "mock"
    config = None
    if not is_mock:
        config = db.query(ApiConfig).filter(ApiConfig.provider == req.provider).first()
        if not config or not config.api_key:
            return {
                "id": "", "prompt": req.prompt, "provider": req.provider,
                "model": req.model, "params": req.params,
                "status": "failed", "video_url": "",
                "error_message": f"API Key 未配置: {req.provider}", "duration": 0,
            }

    # Create task
    task = Task(
        prompt=req.prompt,
        provider=req.provider,
        model=req.model or (config.default_model if config else "mock-v1"),
        params=req.params,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Submit to provider
    adapter = get_adapter(
        req.provider,
        "mock" if is_mock else config.api_key,
        "" if is_mock else config.base_url,
    )
    # 提交前自检：Key 格式 / 必填项不对就直接给出可操作的中文提示
    preflight = adapter.preflight() if hasattr(adapter, "preflight") else ""
    if preflight:
        task.status = "failed"
        task.error_message = preflight
        db.commit()
        db.refresh(task)
        return _task_to_response(task)

    result = adapter.generate(req.prompt, task.model, req.params)

    if result.status == "failed":
        task.status = "failed"
        err = result.error or "生成失败"
        if hasattr(adapter, "_translate_error"):
            err = adapter._translate_error(str(err))
        task.error_message = err
    elif result.status == "completed":
        # 即时完成（Mock 等）：同样要转存本地，避免依赖外链时效
        task.status = "completed"
        task.completed_at = task.created_at
        video_url = result.video_url
        if is_remote_url(video_url):
            local = download_video(video_url, task.id)
            if local:
                params = dict(task.params or {})
                params["source_url"] = video_url
                task.params = params
                video_url = f"/api/videos/{task.id}"
        task.video_url = video_url
    else:
        task.status = "processing"
        task.params = {**(task.params or {}), "provider_task_id": result.task_id}

    db.commit()
    db.refresh(task)

    return _task_to_response(task)


def _task_to_response(task: Task) -> dict:
    return {
        "id": task.id, "prompt": task.prompt, "provider": task.provider,
        "model": task.model or "", "params": task.params or {},
        "status": task.status, "video_url": task.video_url or "",
        "error_message": task.error_message or "", "duration": task.duration or 0,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }
