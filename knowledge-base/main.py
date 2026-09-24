"""
本地知识库系统 - 主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.document_api import router as document_router
from api.search_api import router as search_router
from api.chat_api import router as chat_router
from api.category_api import router as category_router
from config.settings import settings
from services.vector_store import VectorStore
from services.document_processor import DocumentProcessor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    print("🚀 知识库系统启动中...")
    
    # 初始化向量存储
    app.state.vector_store = VectorStore()
    print("✅ 向量存储初始化完成")
    
    # 初始化文档处理器
    app.state.doc_processor = DocumentProcessor()
    print("✅ 文档处理器初始化完成")
    
    print("✅ 知识库系统启动完成")
    
    yield
    
    # 关闭时清理
    print("👋 知识库系统关闭")


app = FastAPI(
    title="本地知识库系统",
    description="支持多数据源输入、多模态内容处理的智能知识库",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(document_router, prefix="/api/kb/documents", tags=["文档管理"])
app.include_router(search_router, prefix="/api/kb/search", tags=["知识检索"])
app.include_router(chat_router, prefix="/api/kb/chat", tags=["智能问答"])
app.include_router(category_router, prefix="/api/kb", tags=["分类标签"])


@app.get("/")
async def root():
    return {
        "name": "本地知识库系统",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
