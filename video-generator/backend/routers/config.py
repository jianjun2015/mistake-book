"""API configuration endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ApiConfig
from ..schemas import ConfigSaveRequest
from ..adapters.providers import get_adapter

router = APIRouter()


@router.get("/config")
async def list_configs(db: Session = Depends(get_db)):
    """Get all API configs (masked keys)."""
    configs = db.query(ApiConfig).all()
    return [
        {
            "id": c.id, "provider": c.provider, "display_name": c.display_name,
            "api_key_masked": _mask_key(c.api_key),
            "base_url": c.base_url, "default_model": c.default_model,
            "params_template": c.params_template or {},
            "is_active": c.is_active,
        }
        for c in configs
    ]


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


@router.get("/config/{provider}/params")
async def get_params(provider: str, db: Session = Depends(get_db)):
    """Get supported parameters for a provider."""
    config = db.query(ApiConfig).filter(ApiConfig.provider == provider).first()
    if not config or not config.api_key:
        raise HTTPException(400, f"API Key 未配置: {provider}")
    adapter = get_adapter(provider, config.api_key, config.base_url)
    return adapter.get_supported_params()


def _mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return key[:4] + "****" + key[-4:]
