"""Provider adapters: Runway, Kling, Seedance.

Based on official API documentation (2026-11):
- Runway: https://docs.dev.runwayml.com (gen4.5, gen3a_turbo retired)
- Kling: https://klingai.com/document-api (v1/v2)
- Seedance: https://www.volcengine.com/docs (Ark API v3)
"""
import time
import httpx
from .base import BaseVideoAdapter, VideoGenerationResult
from .mock import MockAdapter

# 已下线/已失效的模型标识 —— 直接拒绝，不再请求厂商 API
# (Runway gen3a_turbo 2026-07-30 下线; Seedance 1.0 lite/旧 ID 厂商侧已不存在)
RETIRED_MODELS = {
    "runway": ("gen3a_turbo", "gen4_aleph", "gen3a", "gen2"),
    "seedance": (
        "seedance-1-0", "doubao-seedance-1-0-lite-t2v-250428",
        "doubao-seedance-1-0-lite-i2v-250428",
    ),
}


def _check_retired(provider: str, model: str, replacement: str) -> str:
    """Return an error string when the model is retired, else empty string."""
    if model in RETIRED_MODELS.get(provider, ()):
        return f"模型 {model} 已下线/不可用，请改用 {replacement}"
    return ""


class RunwayAdapter(BaseVideoAdapter):
    """Runway API adapter (Gen-4 / multi-model platform).

    Auth: Bearer + X-Runway-Version header.
    Models: gen4.5 (T2V), gen4_turbo (I2V), plus veo3/seedance2/kling etc.
    Note: gen3a_turbo was retired July 2026 - do not use.
    """
    provider = "runway"
    display_name = "Runway"
    default_base_url = "https://api.dev.runwayml.com/v1"
    default_model = "gen4.5"
    models = [
        {"id": "gen4.5", "label": "Gen-4.5", "note": "文生视频主力模型，支持 1280:720 / 720:1280"},
    ]
    API_VERSION = "2024-11-06"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Runway-Version": self.API_VERSION,
            "Content-Type": "application/json",
        }

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or self.default_model
        retired = _check_retired("runway", model, self.default_model)
        if retired:
            return VideoGenerationResult(task_id="", status="failed", error=retired)

        # ratio is required for Runway (not resolution); T2V gen4.5 supports 1280:720 / 720:1280
        ratio_map = {"16:9": "1280:720", "9:16": "720:1280", "1:1": "1280:720", "4:3": "1280:720"}
        payload = {
            "model": model,
            "promptText": prompt[:1000],  # max 1000 chars
            "ratio": params.get("ratio") or ratio_map.get(params.get("aspect_ratio", "16:9"), "1280:720"),
            "duration": int(params.get("duration", 5)),
        }
        try:
            resp = httpx.post(
                f"{self.base_url}/text_to_video",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return VideoGenerationResult(task_id=data.get("id", ""), status="processing", raw_response=data)
            return VideoGenerationResult(
                task_id="", status="failed",
                error=data.get("error", data.get("failure", f"HTTP {resp.status_code}")),
            )
        except Exception as e:
            return VideoGenerationResult(task_id="", status="failed", error=str(e))

    def query(self, task_id: str) -> VideoGenerationResult:
        try:
            resp = httpx.get(
                f"{self.base_url}/tasks/{task_id}",
                headers=self._headers(),
                timeout=15,
            )
            data = resp.json()
            status_map = {
                "PENDING": "pending", "THROTTLED": "pending",
                "RUNNING": "processing", "SUCCEEDED": "completed",
                "FAILED": "failed", "CANCELLED": "failed",
            }
            status = status_map.get(data.get("status", ""), "processing")
            video_url = ""
            if status == "completed":
                output = data.get("output", [])
                if isinstance(output, list) and output:
                    video_url = output[0]
                elif isinstance(output, dict):
                    video_url = output.get("video", "")
            return VideoGenerationResult(
                task_id=task_id, status=status,
                video_url=video_url,
                error=data.get("failure", "") or data.get("failureCode", ""),
                raw_response=data,
            )
        except Exception as e:
            return VideoGenerationResult(task_id=task_id, status="failed", error=str(e))

    def test_connection(self) -> tuple[bool, str]:
        try:
            resp = httpx.get(
                f"{self.base_url}/organization",
                headers=self._headers(),
                timeout=10,
            )
            return resp.status_code == 200, f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)


class KlingAdapter(BaseVideoAdapter):
    """可灵 Kling API adapter (Kuaishou).

    Auth: Bearer token (JWT signed with API Key/Secret).
    Models: kling-v2-master / kling-v2-1 (kling-v1-6 等旧版已下线)
    Endpoint: POST /v1/videos/text2video
    """
    provider = "kling"
    display_name = "可灵 Kling"
    default_base_url = "https://api.klingai.com/v1"
    default_model = "kling-v2-master"
    models = [
        {"id": "kling-v2-master", "label": "Kling v2 Master", "note": "文生视频，画质优先"},
    ]

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or self.default_model
        payload = {
            "model_name": model,
            "prompt": prompt[:2500],  # recommended max 2500
            "duration": str(int(params.get("duration", 5))),
            "aspect_ratio": params.get("aspect_ratio", "16:9"),
        }
        # Optional: resolution in settings
        resolution = params.get("resolution")
        if resolution:
            payload["settings"] = {"resolution": resolution}

        try:
            resp = httpx.post(
                f"{self.base_url}/videos/text2video",
                json=payload,
                headers=self._headers(),
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
                headers=self._headers(),
                timeout=15,
            )
            data = resp.json()
            task_data = data.get("data", {})
            status_map = {
                "submitted": "pending", "processing": "processing",
                "succeed": "completed", "succeeded": "completed",
                "failed": "failed",
            }
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
                headers=self._headers(),
                timeout=10,
            )
            return resp.status_code in (200, 400, 401, 404), f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)


class SeedanceAdapter(BaseVideoAdapter):
    """字节跳动 Seedance API adapter (Volcengine Ark).

    Auth: Bearer API Key (from ark.volcengine.com).
    Models (current): doubao-seedance-2-5-260628 / 2-0-260128 / 1-5-pro-251215 / 1-0-pro-250528.
    1.0 lite 与旧 seedance-1-0 标识已下线/不可用。
    Endpoint: POST /contents/generations/tasks
    """
    provider = "seedance"
    display_name = "Seedance (字节)"
    default_base_url = "https://ark.cn-beijing.volces.com/api/v3"
    default_model = "doubao-seedance-2-0-260128"
    models = [
        {"id": "doubao-seedance-2-5-260628", "label": "Seedance 2.5", "note": "最新系列，画质与一致性更强"},
        {"id": "doubao-seedance-2-0-260128", "label": "Seedance 2.0", "note": "默认，稳定通用"},
    ]

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        params = params or {}
        model = model or self.default_model
        retired = _check_retired("seedance", model, self.default_model)
        if retired:
            return VideoGenerationResult(task_id="", status="failed", error=retired)
        payload = {
            "model": model,
            "content": [{"type": "text", "text": prompt}],
            "resolution": params.get("resolution", "720p"),
            "duration": int(params.get("duration", 5)),
        }
        # Optional params
        if params.get("ratio"):
            payload["ratio"] = params["ratio"]
        else:
            payload["ratio"] = params.get("aspect_ratio", "16:9")

        try:
            resp = httpx.post(
                f"{self.base_url}/contents/generations/tasks",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = resp.json()
            task_id = data.get("id", "")
            if task_id:
                return VideoGenerationResult(task_id=task_id, status="processing", raw_response=data)
            error = data.get("error", {})
            return VideoGenerationResult(
                task_id="", status="failed",
                error=error.get("message", str(data)) if isinstance(error, dict) else str(error),
            )
        except Exception as e:
            return VideoGenerationResult(task_id="", status="failed", error=str(e))

    def query(self, task_id: str) -> VideoGenerationResult:
        try:
            resp = httpx.get(
                f"{self.base_url}/contents/generations/tasks/{task_id}",
                headers=self._headers(),
                timeout=15,
            )
            data = resp.json()
            status_map = {
                "queued": "pending", "running": "processing",
                "succeeded": "completed", "failed": "failed",
                "cancelled": "failed", "expired": "failed",
            }
            status = status_map.get(data.get("status", ""), "processing")
            video_url = ""
            if status == "completed":
                content = data.get("content", {})
                video_url = content.get("video_url", "")
            error = data.get("error", {})
            return VideoGenerationResult(
                task_id=task_id, status=status,
                video_url=video_url,
                error=error.get("message", "") if isinstance(error, dict) else str(error),
                raw_response=data,
            )
        except Exception as e:
            return VideoGenerationResult(task_id=task_id, status="failed", error=str(e))

    # 离线兜底清单（仅当账户模型清单接口不可用时使用）
    FALLBACK_MODELS = [
        {"id": "doubao-seedance-2-5-flash-261115", "label": "Seedance 2.5 Flash", "note": "最新，性价比高"},
        {"id": "doubao-seedance-2-5-260628", "label": "Seedance 2.5", "note": "最新系列，画质更强"},
        {"id": "doubao-seedance-2-0-fast-260128", "label": "Seedance 2.0 Fast", "note": "生成更快"},
        {"id": "doubao-seedance-2-0-260128", "label": "Seedance 2.0", "note": "稳定通用"},
        {"id": "doubao-seedance-2-0-mini-260615", "label": "Seedance 2.0 Mini", "note": "轻量低成本"},
    ]

    def list_remote_models(self) -> list:
        """从方舟账户真实模型清单拉取视频模型（domain=VideoGeneration）。"""
        try:
            resp = httpx.get(
                f"{self.base_url}/models",
                params={"page_size": 200},
                headers=self._headers(),
                timeout=20,
            )
            if resp.status_code != 200:
                return []
            data = resp.json().get("data", [])
            out = []
            for m in data:
                if m.get("domain") != "VideoGeneration":
                    continue
                if not m.get("api_supported", {}).get("contents/generations"):
                    continue
                mid = m.get("id", "")
                if not mid:
                    continue
                label = mid.replace("doubao-seedance-", "Seedance ").replace("-", " ")
                note = "来自方舟账户模型清单"
                out.append({"id": mid, "label": label, "note": note})
            # 新的排前面（created 越大越新）
            order = {m.get("id"): m.get("created", 0) for m in data}
            out.sort(key=lambda x: order.get(x["id"], 0), reverse=True)
            return out
        except Exception:
            return []

    def available_models(self) -> list:
        """优先用账户真实清单；不可用时退回兜底清单。"""
        return self.list_remote_models() or self.FALLBACK_MODELS or list(self.models)

    def probe_model(self, model: str):
        """用非法 duration 探测模型可用性：不会真正创建付费任务。"""
        try:
            resp = httpx.post(
                f"{self.base_url}/contents/generations/tasks",
                json={"model": model, "content": [{"type": "text", "text": "probe"}],
                      "duration": 9999, "resolution": "720p"},
                headers=self._headers(),
                timeout=20,
            )
            try:
                err = resp.json().get("error", {})
            except Exception:
                err = {}
            code = err.get("code", "")
            msg = (err.get("message") or "").strip()
            if code == "ModelNotOpen":
                return {"state": "not_activated", "message": "账户未在方舟控制台开通该模型"}
            if code == "InvalidEndpointOrModel.NotFound":
                return {"state": "not_found", "message": "模型不存在或无权访问" }
            if resp.status_code == 200:
                return {"state": "available", "message": "可用（探测时意外创建了任务，请到控制台检查）" }
            if "InvalidParameter" in code or "InvalidParameter" in msg or "duration" in msg.lower():
                return {"state": "available", "message": "可用（模型已开通）" }
            return {"state": "unknown", "message": f"HTTP {resp.status_code} {msg[:80]}" }
        except Exception as exc:
            return {"state": "unknown", "message": str(exc)[:80]}

    def test_connection(self) -> tuple[bool, str]:
        try:
            resp = httpx.get(
                f"{self.base_url}/contents/generations/tasks",
                headers=self._headers(),
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
    "mock": MockAdapter,
}


def get_adapter(provider: str, api_key: str, base_url: str = "") -> BaseVideoAdapter:
    """Get adapter instance for provider. Use MockAdapter when api_key='mock'."""
    if api_key == "mock" or provider == "mock":
        return MockAdapter(api_key=api_key, base_url=base_url)
    cls = ADAPTERS.get(provider)
    if not cls:
        raise ValueError(f"unknown provider: {provider}")
    return cls(api_key=api_key, base_url=base_url)
