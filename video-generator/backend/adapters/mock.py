"""Mock adapter for testing without real API keys.

Simulates video generation with a placeholder video.
Enable by setting api_key = "mock" for any provider.
"""
import time
import uuid
from .base import BaseVideoAdapter, VideoGenerationResult

# Sample videos for mock mode (public domain test videos)
MOCK_VIDEOS = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
]


class MockAdapter(BaseVideoAdapter):
    """Mock adapter that simulates video generation instantly."""
    provider = "mock"
    display_name = "Mock 测试模式"
    default_model = "mock-v1"
    models = [{"id": "mock-v1", "label": "内置示例视频", "kind": "mock"}]

    def __init__(self, api_key: str = "mock", base_url: str = ""):
        super().__init__(api_key=api_key or "mock", base_url=base_url)
        self._tasks: dict = {}

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        task_id = f"mock-{uuid.uuid4().hex[:12]}"
        # Simulate instant completion
        self._tasks[task_id] = {
            "prompt": prompt,
            "model": model or "mock-v1",
            "params": params,
            "status": "completed",
            "created_at": time.time(),
        }
        return VideoGenerationResult(
            task_id=task_id,
            status="completed",
            video_url=MOCK_VIDEOS[hash(prompt) % len(MOCK_VIDEOS)],
            raw_response={"mock": True, "task_id": task_id},
        )

    def query(self, task_id: str) -> VideoGenerationResult:
        task = self._tasks.get(task_id)
        if not task:
            return VideoGenerationResult(task_id=task_id, status="completed",
                                         video_url=MOCK_VIDEOS[0])
        return VideoGenerationResult(
            task_id=task_id,
            status="completed",
            video_url=MOCK_VIDEOS[hash(task.get("prompt", "")) % len(MOCK_VIDEOS)],
            raw_response={"mock": True},
        )

    def test_connection(self) -> tuple[bool, str]:
        return True, "Mock 模式连接正常"
