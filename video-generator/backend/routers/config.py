"""API configuration endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ApiConfig
from ..schemas import ConfigSaveRequest
import time

from ..adapters.providers import get_adapter, ADAPTERS
from ..services import llm_client

router = APIRouter()

# 模型可用性探测缓存：{(provider, model): (ts, result)}
_PROBE_CACHE: dict[tuple, tuple[float, dict]] = {}
_PROBE_TTL = 600


def _probe_cached(adapter, provider: str, model: str) -> dict:
    key = (provider, model)
    now = time.time()
    hit = _PROBE_CACHE.get(key)
    if hit and now - hit[0] < _PROBE_TTL:
        return hit[1]
    result = adapter.probe_model(model)
    if result is None:
        return {"state": "unverified", "message": "该厂商不支持自动探测"}
    _PROBE_CACHE[key] = (now, result)
    return result


@router.get("/config")
async def list_configs(db: Session = Depends(get_db)):
    """Get all API configs (masked keys)."""
    configs = db.query(ApiConfig).all()
    result = []
    for c in configs:
        # Mock provider always shows as configured
        masked = "内置测试模式" if c.provider == "mock" else _mask_key(c.api_key)
        result.append({
            "id": c.id, "provider": c.provider, "display_name": c.display_name,
            "api_key_masked": masked,
            "base_url": c.base_url, "default_model": c.default_model,
            "params_template": c.params_template or {},
            "is_active": c.is_active,
        })
    return result


@router.post("/config")
async def save_config(req: ConfigSaveRequest, db: Session = Depends(get_db)):
    """Save/update API config."""
    if not req.provider:
        raise HTTPException(400, "provider 不能为空")
    
    config = db.query(ApiConfig).filter(ApiConfig.provider == req.provider).first()
    if not config:
        config = ApiConfig(provider=req.provider, display_name=req.provider)
        db.add(config)

    if req.api_key:  # Only update key if provided (don't overwrite with empty)
        config.api_key = req.api_key
    if req.base_url:
        config.base_url = req.base_url
    if req.default_model:
        config.default_model = req.default_model
    if req.params_template:
        config.params_template = req.params_template

    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    
    return {
        "saved": True, 
        "provider": config.provider,
        "api_key_masked": _mask_key(config.api_key),
    }


@router.post("/config/{provider}/test")
async def test_connection(provider: str, db: Session = Depends(get_db)):
    """Test API connection."""
    config = db.query(ApiConfig).filter(ApiConfig.provider == provider).first()
    if not config or not config.api_key:
        raise HTTPException(400, f"API Key 未配置: {provider}")

    adapter = get_adapter(provider, config.api_key, config.base_url)
    success, message = adapter.test_connection()
    return {"provider": provider, "success": success, "message": message}


@router.get("/config/{provider}/models")
async def list_models(provider: str, probe: bool = False, db: Session = Depends(get_db)):
    """返回该厂商可选模型目录；probe=true 时附带账户可用性探测。"""
    if provider not in ADAPTERS:
        raise HTTPException(404, f"未知厂商: {provider}")
    config = db.query(ApiConfig).filter(ApiConfig.provider == provider).first()
    api_key = (config.api_key if config else "") or ""
    base_url = (config.base_url if config else "") or ""
    adapter = get_adapter(provider, api_key, base_url)

    models = []
    for m in adapter.available_models():
        item = dict(m)
        if probe and api_key:
            item["status"] = _probe_cached(adapter, provider, item["id"])
        else:
            item["status"] = {"state": "unverified", "message": "未探测"}
        models.append(item)

    return {
        "provider": provider,
        "default_model": adapter.default_model or (config.default_model if config else ""),
        "models": models,
        # 语言模型只能用于 AI 润色/分镜，不能生成视频
        "text_only_models": llm_client.available_text_models(),
    }


@router.get("/config/{provider}/params")
async def get_params(provider: str, db: Session = Depends(get_db)):
    """Get supported parameters for a provider."""
    if provider not in ADAPTERS:
        raise HTTPException(404, f"未知厂商: {provider}")
    config = db.query(ApiConfig).filter(ApiConfig.provider == provider).first()
    api_key = (config.api_key if config else "") or ""
    base_url = (config.base_url if config else "") or ""
    adapter = get_adapter(provider, api_key, base_url)
    params = adapter.get_supported_params()
    params.setdefault("model", {"type": "select",
                  "options": [m["id"] for m in adapter.available_models()],
                  "default": adapter.default_model})
    return params


def _mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return key[:4] + "****" + key[-4:]
