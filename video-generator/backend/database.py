"""Database setup — SQLite + SQLAlchemy."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
VIDEO_DIR = DATA_DIR / "videos"
VIDEO_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "video.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    """Create tables."""
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Seed default API configs (per official docs 2026-11)
    from .models import ApiConfig
    db = SessionLocal()
    try:
        existing = {c.provider for c in db.query(ApiConfig).all()}
        defaults = [
            {
                "provider": "runway", "display_name": "Runway",
                "base_url": "https://api.dev.runwayml.com/v1",
                "default_model": "gen4.5",  # gen3a_turbo retired July 2026
            },
            {
                "provider": "kling", "display_name": "可灵 Kling",
                "base_url": "https://api.klingai.com/v1",
                "default_model": "kling-v1-6",
            },
            {
                "provider": "seedance", "display_name": "Seedance (字节)",
                "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                "default_model": "doubao-seedance-1-0-lite-t2v-250428",
            },
            {
                "provider": "mock", "display_name": "🧪 Mock 测试",
                "base_url": "",
                "default_model": "mock-v1",
            },
        ]
        for d in defaults:
            if d["provider"] not in existing:
                db.add(ApiConfig(**d))
            else:
                # Update existing records with correct base_url/default_model
                config = db.query(ApiConfig).filter(ApiConfig.provider == d["provider"]).first()
                config.base_url = d["base_url"]
                config.default_model = d["default_model"]
                config.display_name = d["display_name"]
        db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
