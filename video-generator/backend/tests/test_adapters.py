"""Adapter unit tests — provider HTTP calls are mocked.

重点覆盖：已下线模型拦截、厂商请求/响应与状态映射。
"""

from unittest.mock import MagicMock, patch

from backend.adapters.providers import RunwayAdapter, SeedanceAdapter, KlingAdapter, get_adapter


def _resp(status_code=200, json_data=None):
    r = MagicMock()
    r.status_code = status_code
    r.json.return_value = json_data or {}
    return r


class TestRunway:
    def test_retired_model_rejected_without_http(self):
        a = RunwayAdapter(api_key="key_x")
        with patch("backend.adapters.providers.httpx.post") as post:
            result = a.generate("a cat", model="gen3a_turbo")
        assert result.status == "failed"
        assert "已下线" in result.error
        post.assert_not_called()

    def test_all_known_retired_models_blocked(self):
        a = RunwayAdapter(api_key="key_x")
        for model in ("gen3a_turbo", "gen4_aleph", "gen3a", "gen2"):
            assert a.generate("x", model=model).status == "failed"

    def test_version_header_and_ratio_mapping(self):
        a = RunwayAdapter(api_key="key_x")
        with patch("backend.adapters.providers.httpx.post", return_value=_resp(200, {"id": "t1"})) as post:
            result = a.generate("a cat", params={"aspect_ratio": "9:16", "duration": 5})
        assert result.task_id == "t1"
        args, kwargs = post.call_args
        assert kwargs["headers"]["X-Runway-Version"] == "2024-11-06"
        assert kwargs["json"]["model"] == "gen4.5"
        assert kwargs["json"]["ratio"] == "720:1280"  # 9:16 -> 竖屏

    def test_query_parses_output_url_list(self):
        a = RunwayAdapter(api_key="key_x")
        data = {"status": "SUCCEEDED", "output": ["https://cdn/video.mp4"]}
        with patch("backend.adapters.providers.httpx.get", return_value=_resp(200, data)):
            result = a.query("t1")
        assert result.status == "completed"
        assert result.video_url == "https://cdn/video.mp4"

    def test_query_throttled_is_pending(self):
        a = RunwayAdapter(api_key="key_x")
        with patch("backend.adapters.providers.httpx.get", return_value=_resp(200, {"status": "THROTTLED"})):
            assert a.query("t1").status == "pending"


class TestSeedance:
    def test_retired_model_rejected(self):
        a = SeedanceAdapter(api_key="ark-x")
        with patch("backend.adapters.providers.httpx.post") as post:
            result = a.generate("小猫", model="doubao-seedance-1-0-lite-t2v-250428")
        assert result.status == "failed" and "已下线" in result.error
        post.assert_not_called()
        assert SeedanceAdapter(api_key="ark-x").generate("x", model="seedance-1-0").status == "failed"

    def test_generate_payload(self):
        a = SeedanceAdapter(api_key="ark-x")
        with patch("backend.adapters.providers.httpx.post", return_value=_resp(200, {"id": "cgt-1"})) as post:
            result = a.generate("小猫打哈欠", params={"duration": 5, "resolution": "720p"})
        assert result.task_id == "cgt-1"
        args, kwargs = post.call_args
        assert args[0] == "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"
        assert kwargs["json"]["model"] == "doubao-seedance-2-0-260128"
        assert kwargs["json"]["content"] == [{"type": "text", "text": "小猫打哈欠"}]

    def test_query_states(self):
        a = SeedanceAdapter(api_key="ark-x")
        cases = {
            'succeeded': ('completed', 'https://tos/v.mp4'),
            'queued': ('pending', ''),
            'running': ('processing', ''),
            'expired': ('failed', ''),
        }
        for raw, (expected, _) in cases.items():
            data = {"status": raw, "content": {"video_url": "https://tos/v.mp4"}}
            with patch("backend.adapters.providers.httpx.get", return_value=_resp(200, data)):
                assert a.query("cgt-1").status == expected, raw


class TestKling:
    def test_query_states(self):
        a = KlingAdapter(api_key="fake-jwt-token")
        data = {"code": 0, "data": {"task_status": "succeed", "task_result": {"videos": [{"url": "https://kling/v.mp4"}]}}}
        with patch("backend.adapters.providers.httpx.get", return_value=_resp(200, data)):
            result = a.query("kt-1")
        assert result.status == "completed" and result.video_url == "https://kling/v.mp4"

    def test_generate_payload(self):
        a = KlingAdapter(api_key="fake-jwt-token")
        with patch("backend.adapters.providers.httpx.post", return_value=_resp(200, {"code": 0, "data": {"task_id": "kt-1"}})) as post:
            result = a.generate("a cat", params={"duration": 5, "aspect_ratio": "16:9"})
        assert result.task_id == "kt-1"
        args, kwargs = post.call_args
        assert args[0].endswith("/videos/text2video")
        assert kwargs["json"]["model_name"] == "kling-v2-master"
        assert kwargs["json"]["duration"] == "5"


class TestMock:
    def test_mock_adapter_instant(self):
        a = get_adapter("mock", "mock")
        result = a.generate("a cat")
        assert result.status == "completed" and result.video_url.startswith("http")
