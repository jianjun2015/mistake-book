"""
数据模型定义
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    """文档状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileType(str, Enum):
    """文件类型"""
    TEXT = "text"
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    XLSX = "xlsx"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    CODE = "code"
    WEB = "web"
    CSV = "csv"
    JSON = "json"


class ParsedDocument(BaseModel):
    """解析后的文档"""
    id: str
    filename: str
    file_type: str
    content: str
    metadata: Dict[str, Any] = {}
    chunks: List["DocumentChunk"] = []
    created_at: datetime = Field(default_factory=datetime.now)


class DocumentChunk(BaseModel):
    """文档分块"""
    id: str
    document_id: str
    content: str
    chunk_index: int
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = {}
    page_number: Optional[int] = None
    start_char: int = 0
    end_char: int = 0


class Document(BaseModel):
    """文档元数据"""
    id: Optional[int] = None
    title: str
    filename: str
    file_type: str
    file_size: int
    file_path: str
    category: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None
    chunk_count: int = 0
    status: DocumentStatus = DocumentStatus.PENDING
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DocumentCreate(BaseModel):
    """创建文档请求"""
    title: str
    category: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    """更新文档请求"""
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None


class SearchResult(BaseModel):
    """搜索结果"""
    id: str
    document_id: str
    content: str
    score: float
    metadata: Dict[str, Any] = {}
    highlight: Optional[str] = None


class SearchRequest(BaseModel):
    """搜索请求"""
    query: str
    search_type: str = "hybrid"  # semantic / keyword / hybrid
    top_k: int = 5
    filters: Optional[Dict[str, Any]] = None


class SearchResponse(BaseModel):
    """搜索响应"""
    query: str
    results: List[SearchResult]
    total: int
    latency_ms: float


class ChatMessage(BaseModel):
    """对话消息"""
    role: str  # user / assistant
    content: str
    citations: List[Dict[str, Any]] = []
    timestamp: datetime = Field(default_factory=datetime.now)


class ChatRequest(BaseModel):
    """问答请求"""
    question: str
    conversation_id: Optional[str] = None
    use_rag: bool = True


class ChatResponse(BaseModel):
    """问答响应"""
    answer: str
    conversation_id: str
    citations: List[Dict[str, Any]] = []
    sources: List[SearchResult] = []


class Category(BaseModel):
    """分类"""
    id: Optional[int] = None
    name: str
    parent_id: Optional[int] = None
    sort_order: int = 0
    children: List["Category"] = []


class Tag(BaseModel):
    """标签"""
    id: Optional[int] = None
    name: str
    usage_count: int = 0


# 更新前向引用
ParsedDocument.model_rebuild()
Category.model_rebuild()
