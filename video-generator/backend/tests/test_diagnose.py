"""厂商自检 / 错误翻译 / 环境诊断测试 —— 保证「跑不通」时说人话。"""
import pytest

from backend.adapters.providers import (
    RunwayAdapter, KlingAdapter, SeedanceAdapter, _translate_ark_error,
)


# ---------- 提交前自检 ----------

def test_runway_rejects_key_without_prefix():
    msg = RunwayAdapter("rw_test1234").preflight()
    assert "key_" in msg
    assert "Must start" not in msg  # 必须是中文可操作提示
    assert RunwayAdapter("key_valid123").preflight() == ""


def test_kling_requires_ak_sk_pair():
    msg = KlingAdapter("only-one-key").preflight()
    assert "AK:SK" in msg
    assert KlingAdapter("ak_xxx:sk_yyy").preflight() == ""


def test_seedance_rejects_coding_endpoint():
    a = SeedanceAdapter("ark-key", "https://ark.cn-beijing.volces.com/api/coding/v3")
    assert "Coding 套餐" in a.preflight()
    b = SeedanceAdapter("ark-key", "https://ark.cn-beijing.volces.com/api/v3")
    assert b.preflight() == ""


def test_preflight_requires_key_everywhere():
    for cls in (RunwayAdapter, KlingAdapter, SeedanceAdapter):
        assert "未配置" in cls("").preflight()


# ---------- 错误翻译 ----------

def test_ark_model_not_open_is_translated():
    raw = ("Your account 2135031164 has not activated the model "
           "doubao-seedance-2-0-260128. Please activate the model service in the Ark Console.")
    msg = _translate_ark_error(raw, "doubao-seedance-2-0-260128")
    assert "未在当前账户开通" in msg
    assert "console.volcengine.com" in msg


def test_ark_not_found_is_translated():
    raw = 'InvalidEndpointOrModel.NotFound: the model does not exist'
    msg = _translate_ark_error(raw, "doubao-seedance-9-9")
    assert "不存在或无权访问" in msg


def test_coding_plan_video_rejected_message():
    raw = "doubao-seedance-2-0-260128 does not support the coding plan feature"
    msg = _translate_ark_error(raw, "doubao-seedance-2-0-260128")
    assert "不能生成视频" in msg


def test_unknown_error_passthrough():
    assert _translate_ark_error("some weird thing") == "some weird thing"


# ---------- 环境自检接口 ----------

def test_diagnose_reports_blockers(client):
    d = client.get("/api/config/diagnose", params={"probe": False}).json()
    assert "providers" in d and "ark_console" in d
    names = {p["provider"] for p in d["providers"]}
    assert names == {"runway", "kling", "seedance", "mock"}
    # 没有 Key 时必须给出 next_step，而不是留空
    for p in d["providers"]:
        assert p["next_step"]
    # mock 天然可用
    mock = next(p for p in d["providers"] if p["provider"] == "mock")
    assert mock["ready"] is True


def test_generate_fails_fast_on_bad_key_format(client, monkeypatch):
    """Runway Key 格式错时不应发起任何网络请求，直接返回中文提示。"""
    from backend.routers import generate as gen_router
    from backend.models import ApiConfig
    from backend.database import SessionLocal

    db = SessionLocal()
    try:
        cfg = db.query(ApiConfig).filter(ApiConfig.provider == "runway").first()
        cfg.api_key = "rw_bad_format_key"
        db.commit()
    finally:
        db.close()

    called = {"n": 0}

    def boom(*a, **kw):
        called["n"] += 1
        raise AssertionError("不应调用厂商接口")

    monkeypatch.setattr("backend.adapters.providers.httpx.post", boom)
    r = client.post("/api/generate", json={"prompt": "x", "provider": "runway", "params": {}})
    body = r.json()
    assert body["status"] == "failed"
    assert "key_" in body["error_message"]
    assert called["n"] == 0
