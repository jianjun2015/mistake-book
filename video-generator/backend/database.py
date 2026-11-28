"""Database setup — SQLite + SQLAlchemy."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = Path(os.environ.get("VIDEO_GENERATOR_DATA_DIR", Path(__file__).parent.parent / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR = DATA_DIR / "videos"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

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
                "default_model": "gen4.5",  # gen3a_turbo 2026-07 下线，已移除
            },
            {
                "provider": "kling", "display_name": "可灵 Kling",
                "base_url": "https://api.klingai.com/v1",
                "default_model": "kling-v2-master",  # kling-v1-6 等旧版已下线
            },
            {
                "provider": "seedance", "display_name": "Seedance (字节)",
                "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                "default_model": "doubao-seedance-2-0-260128",  # 1.0 lite/seedance-1-0 已下线
            },
            {
                "provider": "mock", "display_name": "🧪 Mock 测试",
                "base_url": "",
                "default_model": "mock-v1",
            },
        ]
        # 已下线/错误的历史值 —— 启动时自动迁移到当前模型
        stale_models = {
            "gen3a_turbo", "gen4_aleph", "gen3a", "gen2",
            "kling-v1-6", "kling-v1-5", "kling-v1-0",
            "seedance-1-0", "doubao-seedance-1-0-lite-t2v-250428",
            "doubao-seedance-1-0-lite-i2v-250428",
        }
        for d in defaults:
            if d["provider"] not in existing:
                db.add(ApiConfig(**d))
            else:
                # 仅修正错误/已下线的值，不覆盖用户主动配置的 base_url/模型
                config = db.query(ApiConfig).filter(ApiConfig.provider == d["provider"]).first()
                if not config.base_url:
                    config.base_url = d["base_url"]
                if not config.default_model or config.default_model in stale_models:
                    config.default_model = d["default_model"]
                if not config.display_name:
                    config.display_name = d["display_name"]
        db.commit()
    finally:
        db.close()


def load_runtime_settings():
    """把持久化的设置载入进程环境，供 llm_client 读取。"""
    import os as _os

    from .models import AppSetting
    db = SessionLocal()
    try:
        from .services.llm_client import set_preferred_channel

        channel = ""
        for row in db.query(AppSetting).all():
            if row.key == "ai.text_model" and row.value:
                _os.environ["ARK_MODEL"] = row.value
            elif row.key == "ai.text_channel" and row.value:
                channel = row.value
        if channel:
            set_preferred_channel(channel)
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
