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
from ..models import AppSetting
import asyncio
import os

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


# 文本模型探测缓存
_TEXT_PROBE_CACHE: dict[tuple, tuple[float, dict]] = {}


def _get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(AppSetting).filter(AppSetting.key == key).first()
    return row.value if row and row.value else default


def _set_setting(db: Session, key: str, value: str) -> None:
    row = db.query(AppSetting).filter(AppSetting.key == key).first()
    if row:
        row.value = value
        row.updated_at = datetime.utcnow()
    else:
        db.add(AppSetting(key=key, value=value))


@router.get("/config/ai/text-models")
async def list_text_models(probe: bool = False, db: Session = Depends(get_db)):
    """AI 语言模型清单（方舟 Coding 套餐 + MiMo）。probe=true 时逐个实测可用性。"""
    data = llm_client.available_text_models()
    current = _get_setting(db, "ai.text_model") or llm_client.default_ark_model()

    now = time.time()
    pending: list[tuple[int, str, str]] = []
    models = []
    for idx, m in enumerate(data["models"]):
        item = dict(m)
        item["selected"] = item["id"] == current
        if not probe:
            item["status"] = {"state": "unverified", "message": "未探测（点「探测可用性」实测）"}
        else:
            hit = _TEXT_PROBE_CACHE.get((item["channel"], item["id"]))
            if hit and now - hit[0] < _PROBE_TTL:
                item["status"] = hit[1]
            else:
                pending.append((idx, item["id"], item["channel"]))
        models.append(item)

    if pending:
        # 并发探测，避免 14 个模型串行等待
        results = await asyncio.gather(
            *(llm_client.probe_text_model(mid, ch) for _, mid, ch in pending)
        )
        for (idx, mid, ch), st in zip(pending, results):
            _TEXT_PROBE_CACHE[(ch, mid)] = (now, st)
            models[idx]["status"] = st

    return {
        "channels": data["channels"],
        "models": models,
        "current": current,
        "preferred_channel": llm_client.preferred_channel(),
        "note": "以上均为语言模型，只用于 AI 润色/分镜，不能生成视频。",
    }


@router.post("/config/ai/text-model")
async def set_text_model(payload: dict, db: Session = Depends(get_db)):
    """保存默认语言模型，并立即生效（写入进程环境，无需重启）。"""
    raw = str((payload or {}).get("model") or "").strip()
    channel = str((payload or {}).get("channel") or "ark").strip()
    if not raw:
        raise HTTPException(400, "model 不能为空")

    if channel == "ark":
        norm = llm_client._normalize_model(raw)
        if norm not in llm_client.ARK_TEXT_MODELS:
            raise HTTPException(
                400,
                f"模型 {raw} 不在方舟 Coding 套餐清单内，可选：{', '.join(llm_client.ARK_TEXT_MODELS)}",
            )
        os.environ["ARK_MODEL"] = norm
        saved = norm
    elif channel == "mimo":
        saved = llm_client.DEFAULT_MIMO_MODEL
    else:
        raise HTTPException(400, f"未知通道: {channel}")

    llm_client.set_preferred_channel(channel)
    _set_setting(db, "ai.text_model", saved)
    _set_setting(db, "ai.text_channel", channel)
    db.commit()
    return {"saved": True, "channel": channel, "model": saved}


def _mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return key[:4] + "****" + key[-4:]
