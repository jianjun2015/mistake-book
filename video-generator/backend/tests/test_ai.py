"""分镜生成测试 —— 覆盖「分镜必须完成填充」的关键约束。"""
import json

import pytest

from backend.routers import ai as ai_router
from backend.services.storyboard_local import build_storyboard

SCRIPT = (
    "一只小猫在森林里迷路了。它遇到一只善良的鹿，带它找到了回家的路。"
    "天黑了，小猫终于回到家，母亲拥抱了它。"
)


# ---------- 本地规则生成器 ----------

def test_local_builder_fills_every_shot():
    r = build_storyboard(SCRIPT, 3, "电影质感", ["小猫", "森林"])
    assert r["total_shots"] == 3
    assert r["total_duration"] > 0
    for shot in r["shots"]:
        # 核心断言：不允许出现空描述
        assert shot["description"].strip()
        assert shot["camera"]
        assert 1 <= shot["duration"] <= 15
        assert shot["transition"] in {"淡入", "淡出", "切换"}
        assert "电影质感" in shot["description"]


def test_local_builder_handles_more_scenes_than_clauses():
    r = build_storyboard("小猫迷路了。", 6)
    # 句子不足时不硬凑空白镜头
    assert r["total_shots"] == 1
    assert all(s["description"].strip() for s in r["shots"])


def test_local_builder_transitions_bookend():
    r = build_storyboard(SCRIPT, 4)
    assert r["shots"][0]["transition"] == "淡入"
    assert r["shots"][-1]["transition"] == "淡出"


def test_local_builder_empty_script():
    r = build_storyboard("   ", 5)
    assert r["total_shots"] == 0


# ---------- 接口降级 ----------

def test_storyboard_degrades_when_llm_unavailable(client, monkeypatch):
    async def boom(system, user):
        raise RuntimeError("LLM 调用失败: 429 quota exhausted")

    monkeypatch.setattr(ai_router, "_call_llm", boom)
    r = client.post("/api/ai/storyboard", json={"script": SCRIPT, "scene_count": 3})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "local"
    assert "配额" in data["notice"]
    assert data["total_shots"] >= 1
    assert all(s["description"].strip() for s in data["shots"])


def test_storyboard_uses_llm_when_available(client, monkeypatch):
    payload = [
        {"shot_id": 1, "camera": "远景", "description": "夕阳下的城市天际线",
         "duration": 5, "transition": "淡入", "dialogue": "", "mood": "壮观"},
        {"shot_id": 2, "camera": "特写", "description": "女孩眼中的泪光",
         "duration": 3, "transition": "淡出", "dialogue": "", "mood": "悲伤"},
    ]

    async def fake(system, user):
        return json.dumps(payload, ensure_ascii=False)

    monkeypatch.setattr(ai_router, "_call_llm", fake)
    r = client.post("/api/ai/storyboard", json={"script": SCRIPT, "scene_count": 2})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "ai"
    assert data["total_shots"] == 2
    assert data["notice"] == ""
    assert data["total_duration"] == 8


def test_storyboard_rejects_empty_descriptions_and_degrades(client, monkeypatch):
    """LLM 返回结构合法但描述为空 —— 等于没填充，必须降级补全。"""
    async def empty_desc(system, user):
        return json.dumps([{"shot_id": 1, "camera": "全景", "description": "  "}])

    monkeypatch.setattr(ai_router, "_call_llm", empty_desc)
    r = client.post("/api/ai/storyboard", json={"script": SCRIPT, "scene_count": 3})
    data = r.json()
    assert data["source"] == "local"
    assert all(s["description"].strip() for s in data["shots"])


def test_storyboard_markdown_wrapped_json(client, monkeypatch):
    async def wrapped(system, user):
        return "```json\n" + json.dumps(
            [{"shot_id": 1, "camera": "中景", "description": "雨中的街道", "duration": 4}],
            ensure_ascii=False,
        ) + "\n```"

    monkeypatch.setattr(ai_router, "_call_llm", wrapped)
    r = client.post("/api/ai/storyboard", json={"script": SCRIPT, "scene_count": 2})
    data = r.json()
    assert data["source"] == "ai"
    assert data["shots"][0]["description"] == "雨中的街道"
    assert data["shots"][0]["transition"] == "切换"  # 缺省值补全
