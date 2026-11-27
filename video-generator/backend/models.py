"""SQLAlchemy models."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, JSON
from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:16]


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=gen_id)
    prompt = Column(Text, nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, default="")
    params = Column(JSON, default=dict)
    status = Column(String, default="pending")  # pending/processing/completed/failed
    video_url = Column(String, default="")
    error_message = Column(Text, default="")
    duration = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class ApiConfig(Base):
    __tablename__ = "api_configs"

    id = Column(String, primary_key=True, default=gen_id)
    provider = Column(String, unique=True, nullable=False)
    display_name = Column(String, default="")
    api_key = Column(String, default="")
    base_url = Column(String, default="")
    default_model = Column(String, default="")
    params_template = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
