"""Pydantic schemas."""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="视频描述")
    provider: str = Field(..., description="厂商: runway/kling/seedance")
    model: str = Field("", description="模型版本")
    params: dict = Field(default_factory=dict, description="分辨率/时长/风格等")


class TaskResponse(BaseModel):
    id: str
    prompt: str
    provider: str
    model: str
    params: dict
    status: str
    video_url: str
    error_message: str
    duration: float
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    size: int


class ConfigSaveRequest(BaseModel):
    provider: str
    api_key: str = ""
    base_url: str = ""
    default_model: str = ""
    params_template: dict = Field(default_factory=dict)


class ConfigResponse(BaseModel):
    id: str
    provider: str
    display_name: str
    api_key_masked: str = ""
    base_url: str
    default_model: str
    params_template: dict
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
