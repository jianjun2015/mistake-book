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

    # Seed default API configs
    from .models import ApiConfig
    db = SessionLocal()
    try:
        existing = {c.provider for c in db.query(ApiConfig).all()}
        defaults = [
            {"provider": "runway", "display_name": "Runway Gen-3", "base_url": "https://api.dev.runwayml.com/v1", "default_model": "gen3a_turbo"},
            {"provider": "kling", "display_name": "可灵 Kling", "base_url": "https://api.klingai.com/v1", "default_model": "kling-v1-6"},
            {"provider": "seedance", "display_name": "Seedance (字节)", "base_url": "https://api.seedance.com/v1", "default_model": "seedance-1-0"},
        ]
        for d in defaults:
            if d["provider"] not in existing:
                db.add(ApiConfig(**d))
        db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
