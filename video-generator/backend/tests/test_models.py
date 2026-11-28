"""模型目录 / 语言模型清单接口测试。"""
from backend.adapters.providers import SeedanceAdapter


def test_video_models_endpoint_structure(client, monkeypatch):
    # 避免真实网络：强制返回固定目录
    monkeypatch.setattr(
        SeedanceAdapter, "list_remote_models",
        lambda self: [
            {"id": "doubao-seedance-2-5-flash-261115", "label": "Seedance 2.5 Flash", "note": "x"},
        ],
    )
    r = client.get("/api/config/seedance/models")
    assert r.status_code == 200
    data = r.json()
    assert data["provider"] == "seedance"
    assert data["default_model"]
    assert isinstance(data["models"], list)
    # 未探测时应为 unverified，且带 text_only_models 说明
    assert data["models"][0]["status"]["state"] == "unverified"
    assert "models" in data["text_only_models"]


def test_probe_marks_not_activated(client, monkeypatch):
    monkeypatch.setattr(
        SeedanceAdapter, "list_remote_models",
        lambda self: [{"id": "doubao-seedance-2-0-260128", "label": "Seedance 2.0", "note": ""}],
    )
    monkeypatch.setattr(
        SeedanceAdapter, "probe_model",
        lambda self, model: {"state": "not_activated", "message": "账户未开通"},
    )
    # seedance 配置无 Key 时 probe 不会触发；临时注入 Key
    from backend.database import get_db
    from backend.models import ApiConfig

    db = next(get_db())
    cfg = db.query(ApiConfig).filter(ApiConfig.provider == "seedance").first()
    cfg.api_key = "ark-test-key"
    db.commit()

    r = client.get("/api/config/seedance/models", params={"probe": "true"})
    data = r.json()
    assert data["models"][0]["status"]["state"] == "not_activated"


def test_ai_models_endpoint(client):
    r = client.get("/api/ai/models")
    assert r.status_code == 200
    data = r.json()
    assert "models" in data and "channels" in data
    assert data["note"]


def test_unknown_provider_404(client):
    r = client.get("/api/config/nonexistent/models")
    assert r.status_code == 404
