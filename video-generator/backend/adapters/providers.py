"""Provider adapters: Runway, Kling, Seedance."""

import time
import httpx
from .base import BaseVideoAdapter, VideoGenerationResult


class RunwayAdapter(BaseVideoAdapter):
    """Runway Gen-3 API adapter."""
    provider = "runway"
    display_name = "Runway Gen-3"

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or "gen3a_turbo"
        payload = {
            "model": model,
            "promptText": prompt,
            "duration": params.get("duration", 5),
            "resolution": params.get("resolution", "720p"),
        }
        try:
            resp = httpx.post(
                f"{self.base_url}/image_to_video" if params.get("image_url") else f"{self.base_url}/text_to_video",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code == 200:
                return VideoGenerationResult(
                    task_id=data.get("id", ""),
                    status="processing",
                    raw_response=data,
                )
            return VideoGenerationResult(
                task_id="", status="failed",
                error=data.get("error", f"HTTP {resp.status_code}"),
            )
        except Exception as e:
            return VideoGenerationResult(task_id="", status="failed", error=str(e))

    def query(self, task_id: str) -> VideoGenerationResult:
        try:
            resp = httpx.get(
                f"{self.base_url}/tasks/{task_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=15,
            )
            data = resp.json()
            status_map = {"PENDING": "pending", "RUNNING": "processing", "SUCCEEDED": "completed", "FAILED": "failed"}
            status = status_map.get(data.get("status", ""), "processing")
            video_url = ""
            if status == "completed":
                output = data.get("output", {})
                video_url = output.get("video", "") if isinstance(output, dict) else str(output)
            return VideoGenerationResult(
                task_id=task_id, status=status,
                video_url=video_url,
                error=data.get("failure", ""),
                raw_response=data,
            )
        except Exception as e:
            return VideoGenerationResult(task_id=task_id, status="failed", error=str(e))

    def test_connection(self) -> tuple[bool, str]:
        try:
            resp = httpx.get(
                f"{self.base_url}/organization",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            return resp.status_code == 200, f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)


class KlingAdapter(BaseVideoAdapter):
    """可灵 Kling API adapter."""
    provider = "kling"
    display_name = "可灵 Kling"

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or "kling-v1-6"
        payload = {
            "model_name": model,
            "prompt": prompt,
            "duration": str(params.get("duration", 5)),
            "aspect_ratio": params.get("aspect_ratio", "16:9"),
        }
        try:
            resp = httpx.post(
                f"{self.base_url}/videos/text2video",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            data = resp.json()
            if data.get("code") == 0:
                task_id = data.get("data", {}).get("task_id", "")
                return VideoGenerationResult(task_id=task_id, status="processing", raw_response=data)
            return VideoGenerationResult(
                task_id="", status="failed",
                error=data.get("message", f"code={data.get('code')}"),
            )
        except Exception as e:
            return VideoGenerationResult(task_id="", status="failed", error=str(e))

    def query(self, task_id: str) -> VideoGenerationResult:
        try:
            resp = httpx.get(
                f"{self.base_url}/videos/text2video/{task_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=15,
            )
            data = resp.json()
            task_data = data.get("data", {})
            status_map = {"submitted": "pending", "processing": "processing", "succeed": "completed", "failed": "failed"}
            status = status_map.get(task_data.get("task_status", ""), "processing")
            video_url = ""
            if status == "completed":
                videos = task_data.get("task_result", {}).get("videos", [])
                if videos:
                    video_url = videos[0].get("url", "")
            return VideoGenerationResult(
                task_id=task_id, status=status,
                video_url=video_url,
                error=task_data.get("task_status_msg", ""),
                raw_response=data,
            )
        except Exception as e:
            return VideoGenerationResult(task_id=task_id, status="failed", error=str(e))

    def test_connection(self) -> tuple[bool, str]:
        try:
            resp = httpx.get(
                f"{self.base_url}/videos/text2video/nonexistent",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            # Even 404 means we can reach the API
            return resp.status_code in (200, 404, 401), f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)


class SeedanceAdapter(BaseVideoAdapter):
    """Seedance (字节跳动) API adapter."""
    provider = "seedance"
    display_name = "Seedance (字节)"

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or "seedance-1-0"
        payload = {
            "model": model,
            "content": [{"type": "text", "text": prompt}],
            "resolution": params.get("resolution", "720p"),
            "duration": params.get("duration", 5),
        }
        try:
            resp = httpx.post(
                f"{self.base_url}/contents/generations/tasks",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            data = resp.json()
            task_id = data.get("id", "") or data.get("data", {}).get("task_id", "")
            if task_id:
                return VideoGenerationResult(task_id=task_id, status="processing", raw_response=data)
            return VideoGenerationResult(
                task_id="", status="failed",
                error=data.get("error", {}).get("message", str(data)),
            )
        except Exception as e:
            return VideoGenerationResult(task_id="", status="failed", error=str(e))

    def query(self, task_id: str) -> VideoGenerationResult:
        try:
            resp = httpx.get(
                f"{self.base_url}/contents/generations/tasks/{task_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=15,
            )
            data = resp.json()
            status_map = {"queued": "pending", "running": "processing", "succeeded": "completed", "failed": "failed"}
            status = status_map.get(data.get("status", ""), "processing")
            video_url = ""
            if status == "completed":
                content = data.get("content", {})
                video_url = content.get("video_url", "")
            return VideoGenerationResult(
                task_id=task_id, status=status,
                video_url=video_url,
                error=data.get("error", {}).get("message", ""),
                raw_response=data,
            )
        except Exception as e:
            return VideoGenerationResult(task_id=task_id, status="failed", error=str(e))

    def test_connection(self) -> tuple[bool, str]:
        try:
            resp = httpx.get(
                f"{self.base_url}/contents/generations/tasks",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            return resp.status_code in (200, 401), f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)


# Registry
ADAPTERS = {
    "runway": RunwayAdapter,
    "kling": KlingAdapter,
    "seedance": SeedanceAdapter,
}


def get_adapter(provider: str, api_key: str, base_url: str = "") -> BaseVideoAdapter:
    """Get adapter instance for provider."""
    cls = ADAPTERS.get(provider)
    if not cls:
        raise ValueError(f"unknown provider: {provider}")
    return cls(api_key=api_key, base_url=base_url)
