"""配置页模型清单 / 默认语言模型接口测试。"""
import pytest

from backend.services import llm_client


@pytest.fixture(autouse=True)
def _fake_keys(monkeypatch):
    """测试环境没有真实 Key：显式注入，保证两个通道都出现在清单里。"""
    monkeypatch.setattr(llm_client, "_ark_key", lambda: "ark-test-key")
    monkeypatch.setattr(llm_client, "_mimo_key", lambda: "mimo-test-key")
    yield


def test_text_models_endpoint_lists_all_channels(client):
    r = client.get("/api/config/ai/text-models")
    assert r.status_code == 200
    d = r.json()
    ids = [m["id"] for m in d["models"]]
    assert "doubao-seed-2.1-pro" in ids
    assert "kimi-k2.8-preview" in ids
    assert "kimi-k3" not in ids
    # 未探测时不应触发任何真实请求
    assert all(m["status"]["state"] == "unverified" for m in d["models"])
    assert d["current"]
    assert "不能生成视频" in d["note"]


def test_text_models_probe_reports_states(client, monkeypatch):
    async def fake_probe(model, channel="ark"):
        return {"state": "available" if channel == "ark" else "quota", "message": "stub"}

    monkeypatch.setattr(llm_client, "probe_text_model", fake_probe)
    r = client.get("/api/config/ai/text-models", params={"probe": True})
    assert r.status_code == 200
    for m in r.json()["models"]:
        expected = "available" if m["channel"] == "ark" else "quota"
        assert m["status"]["state"] == expected


def test_set_text_model_persists_and_validates(client, monkeypatch, tmp_path):
    # 合法模型：保存成功并立即生效
    r = client.post("/api/config/ai/text-model", json={"model": "GLM-5.4", "channel": "ark"})
    assert r.status_code == 200
    assert r.json()["model"] == "glm-5.4"

    d = client.get("/api/config/ai/text-models").json()
    assert d["current"] == "glm-5.4"
    assert [m["id"] for m in d["models"] if m.get("selected")] == ["glm-5.4"]

    # 非法模型被拒绝，并给出可选清单
    bad = client.post("/api/config/ai/text-model", json={"model": "gpt-9", "channel": "ark"})
    assert bad.status_code == 400
    assert "不在方舟 Coding 套餐清单内" in bad.json()["detail"]

    # 复原，避免污染其他测试
    client.post("/api/config/ai/text-model", json={"model": "doubao-seed-2.1-pro", "channel": "ark"})


def test_preferred_channel_changes_llm_priority(client, monkeypatch):
    monkeypatch.setattr(llm_client, "_ark_key", lambda: "ark-key")
    monkeypatch.setattr(llm_client, "_mimo_key", lambda: "mimo-key")

    client.post("/api/config/ai/text-model", json={"model": "mimo-v2.6-pro", "channel": "mimo"})
    assert llm_client.channels()[0]["channel"] == "mimo"
    assert client.get("/api/config/ai/text-models").json()["preferred_channel"] == "mimo"

    client.post("/api/config/ai/text-model", json={"model": "glm-5.3", "channel": "ark"})
    assert llm_client.channels()[0]["channel"] == "ark"


def test_video_provider_models_endpoint_exposes_text_models(client):
    r = client.get("/api/config/seedance/models")
    assert r.status_code == 200
    d = r.json()
    assert d["models"], "视频厂商必须有真实模型清单"
    assert d["text_only_models"]["models"], "应同时暴露语言模型清单，便于配置页说明"
