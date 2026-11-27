"""Video Generator — FastAPI Backend."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .routers import generate, tasks, config


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="文生视频平台",
    description="Text-to-Video Generation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(generate.router, prefix="/api", tags=["生成"])
app.include_router(tasks.router, prefix="/api", tags=["任务"])
app.include_router(config.router, prefix="/api", tags=["配置"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
