"""LLM 多通道与模型名归一化测试。"""
import pytest

from backend.services import llm_client


def test_normalize_lowercase_canonical():
    assert llm_client._normalize_model("doubao-seed-2.1-pro") == "doubao-seed-2.1-pro"


def test_normalize_uppercase_legacy():
    # 旧配置里的首字母大写写法应归一化到小写规范名
    assert llm_client._normalize_model("GLM-5.3") == "glm-5.3"
    assert llm_client._normalize_model("Doubao-Seed-Evolving") == "doubao-seed-evolving"
    assert llm_client._normalize_model("DeepSeek-V4-Pro") == "deepseek-v4-pro"


def test_normalize_alias():
    assert llm_client._normalize_model("glm-latest") == "glm-5.3"


def test_normalize_unknown_passthrough_lower():
    # 不认识的模型名原样小写返回，交给上游报错
    assert llm_client._normalize_model("Some-New-Model") == "some-new-model"
    assert llm_client._normalize_model("  ") == ""


def test_catalog_uses_lowercase_and_excludes_retiring_k3():
    for m in llm_client.ARK_TEXT_MODELS:
        assert m == m.lower(), f"{m} 不是全小写规范"
    assert "kimi-k3" not in llm_client.ARK_TEXT_MODELS
    assert "kimi-k2.8-preview" in llm_client.ARK_TEXT_MODELS
    assert llm_client.DEFAULT_ARK_MODEL == "doubao-seed-2.1-pro"


def test_preview_flag():
    assert "kimi-k2.8-preview" in llm_client.ARK_PREVIEW
    assert "doubao-seed-2.1-pro" not in llm_client.ARK_PREVIEW


def test_ai_models_endpoint_shape(client):
    r = client.get("/api/ai/models")
    assert r.status_code == 200
    data = r.json()
    ids = [m["id"] for m in data["models"]]
    # 全部小写
    assert all(i == i.lower() for i in ids if i.startswith(("doubao", "glm", "deepseek", "kimi")))
    assert "kimi-k3" not in ids
    assert "note" in data


def test_storyboard_accepts_llm_model_field(client, monkeypatch):
    captured = {}

    async def fake_chat(system, user, model="", **kw):
        captured["model"] = model
        return (
            '[{"shot_id":1,"camera":"远景","description":"测试画面描述内容","duration":3,'
            '"transition":"淡入","dialogue":"","mood":"宁静"}]',
            model or "default",
        )

    monkeypatch.setattr(llm_client, "chat", fake_chat)
    r = client.post("/api/ai/storyboard", json={
        "script": "测试剧本", "scene_count": 1, "llm_model": "GLM-5.4",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "ai"
    # llm_model 字段被透传到 LLM 通道（归一化由 test_normalize_* 单测覆盖）
    assert captured["model"] == "GLM-5.4"
