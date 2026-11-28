"""API integration tests — provider adapters are faked; mock 模式全链路."""

from backend.adapters.base import VideoGenerationResult
from backend.services import video_service


class FakeAdapter:
    def __init__(self, query_result=None):
        self.query_result = query_result or VideoGenerationResult(
            task_id="pt-1", status="completed", video_url="https://cdn.example.com/v.mp4",
        )

    def generate(self, prompt, model="", params=None):
        return VideoGenerationResult(task_id="pt-1", status="processing")

    def query(self, task_id):
        return self.query_result

    def test_connection(self):
        return True, "连接成功"


def _save_key(client, provider="runway", key="test-key"):
    r = client.post("/api/config", json={"provider": provider, "api_key": key})
    assert r.status_code == 200


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_generate_requires_api_key(client):
    r = client.post("/api/generate", json={"prompt": "a cat", "provider": "seedance"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "failed" and "API Key" in body["error_message"]


def test_generate_unknown_provider(client):
    r = client.post("/api/generate", json={"prompt": "a cat", "provider": "nope"})
    assert r.status_code == 400


def test_mock_generation_instant_complete(client):
    r = client.post("/api/generate", json={"prompt": "a cat", "provider": "mock", "params": {}})
    body = r.json()
    assert body["status"] == "completed"
    url = body["video_url"]
    # 优先转存本地并走服务端点；无网络时回落到厂商原始外链
    assert url.startswith("/api/videos/") or url.startswith("http"), url
    if url.startswith("/api/videos/"):
        task_id = url.rsplit("/", 1)[-1]
        v = client.get(f"/api/videos/{task_id}")
        assert v.status_code == 200
        assert v.headers["content-type"].startswith("video/")


def test_generate_complete_flow_with_local_persist(client, monkeypatch):
    import backend.routers.generate as gen_mod
    import backend.routers.tasks as tasks_mod

    _save_key(client)
    monkeypatch.setattr(gen_mod, "get_adapter", lambda *a, **k: FakeAdapter())

    r = client.post("/api/generate", json={
        "prompt": "a cat running", "provider": "runway", "params": {"duration": 5},
    })
    task = r.json()
    assert task["status"] == "processing"

    def fake_download(url, task_id, timeout=120.0):
        dest = video_service.local_video_path(task_id)
        dest.write_bytes(b"mp4")
        return str(dest)

    monkeypatch.setattr(tasks_mod, "get_adapter", lambda *a, **k: FakeAdapter())
    monkeypatch.setattr(tasks_mod, "download_video", fake_download)

    done = client.get(f"/api/tasks/{task['id']}").json()
    assert done["status"] == "completed"
    assert done["video_url"] == f"/api/videos/{task['id']}"
    assert done["duration"] >= 0
    assert done["params"]["source_url"].startswith("https://")

    # /videos/{id} serves the persisted local file
    v = client.get(f"/api/videos/{task['id']}")
    assert v.status_code == 200 and v.content == b"mp4"

    # delete removes task and local video
    assert client.delete(f"/api/tasks/{task['id']}").json() == {"deleted": True}
    assert not video_service.local_video_path(task["id"]).exists()


def test_config_masked(client):
    _save_key(client, "runway", "sk-abcdef123456")
    configs = client.get("/api/config").json()
    runway = [c for c in configs if c["provider"] == "runway"][0]
    assert "abcdef123456" not in runway["api_key_masked"]


def test_stale_default_models_migrated(client):
    configs = client.get("/api/config").json()
    by = {c["provider"]: c for c in configs}
    assert by["runway"]["default_model"] == "gen4.5"
    assert by["seedance"]["default_model"] == "doubao-seedance-2-0-260128"
    assert by["kling"]["default_model"] == "kling-v2-master"
    for stale in ("gen3a_turbo", "seedance-1-0", "doubao-seedance-1-0-lite-t2v-250428", "kling-v1-6"):
        assert stale not in [c["default_model"] for c in configs]
