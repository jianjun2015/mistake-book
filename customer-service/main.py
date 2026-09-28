"""
智能客服系统 - FastAPI主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from utils.database import init_db
from api.chat_api import router as chat_router
from api.chat_stream import router as stream_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    logger.info("🚀 智能客服系统启动中...")
    init_db()
    logger.info("✅ 数据库初始化完成")
    logger.info("✅ 智能客服系统启动完成")
    yield
    logger.info("👋 智能客服系统关闭")


app = FastAPI(
    title="智能客服智能体",
    description="基于大模型+知识库的智能客服系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/cs", tags=["智能客服"])
app.include_router(stream_router, prefix="/api/cs", tags=["流式对话"])


@app.get("/")
async def root():
    return {"service": "智能客服智能体", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
