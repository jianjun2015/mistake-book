"""Base adapter for video generation APIs."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class VideoGenerationResult:
    """Unified result from any provider."""
    task_id: str  # Provider's task ID
    status: str  # pending/processing/completed/failed
    video_url: str = ""
    error: str = ""
    raw_response: dict = None

    def __post_init__(self):
        if self.raw_response is None:
            self.raw_response = {}


class BaseVideoAdapter(ABC):
    """Abstract base for video generation providers."""

    provider: str = ""
    display_name: str = ""
    default_base_url: str = ""
    default_model: str = ""
    # 该厂商可选的模型目录（只放已验证可用的 ID）
    models: list = []

    def __init__(self, api_key: str, base_url: str = ""):
        self.api_key = api_key
        self.base_url = (base_url or self.default_base_url).rstrip("/")

    @abstractmethod
    def generate(self, prompt: str, model: str = "", params: dict = None) -> VideoGenerationResult:
        """Submit a video generation task."""
        ...

    @abstractmethod
    def query(self, task_id: str) -> VideoGenerationResult:
        """Query task status/result."""
        ...

    @abstractmethod
    def test_connection(self) -> tuple[bool, str]:
        """Test API connectivity. Returns (success, message)."""
        ...

    def available_models(self) -> list:
        """返回可选择的模型目录。"""
        return list(self.models)

    def probe_model(self, model: str):
        """探测某模型在当前账户下是否可用。默认不支持探测。"""
        return None

    def get_supported_params(self) -> dict:
        """Return supported parameters with defaults."""
        return {
            "resolution": {"type": "select", "options": ["720p", "1080p"], "default": "720p"},
            "duration": {"type": "select", "options": [5, 10], "default": 5},
            "style": {"type": "select", "options": ["realistic", "cinematic", "anime"], "default": "realistic"},
        }

    def preflight(self) -> str:
        """提交前自检（Key 格式、必填项）。返回错误文案，空串表示通过。

        目的：在真正消耗配额/计费前就给出可操作的中文提示，
        而不是把厂商原始报错原样抛给用户。
        """
        if not self.api_key:
            return f"{self.display_name} 未配置 API Key"
        return ""

    def _translate_error(self, text: str) -> str:
        """把厂商原始错误翻译成可操作的中文提示。默认原样返回。"""
        return text or ""

    def _mask_key(self) -> str:
        if not self.api_key:
            return "(未配置)"
        if len(self.api_key) <= 8:
            return "****"
        return self.api_key[:4] + "****" + self.api_key[-4:]
