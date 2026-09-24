"""
配置文件
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """应用配置"""
    
    # API配置
    API_V1_STR: str = "/api/kb"
    PROJECT_NAME: str = "本地知识库系统"
    
    # 数据库配置
    MYSQL_URL: str = "mysql+pymysql://root:password@localhost:3306/knowledge_base"
    MONGODB_URL: str = "mongodb://localhost:27017"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 向量数据库配置
    CHROMA_PERSIST_DIR: str = "./data/chroma"
    CHROMA_COLLECTION: str = "knowledge_base"
    
    # Embedding模型配置
    EMBEDDING_MODEL: str = "BAAI/bge-m3"  # 或 "shibing624/text2vec-base-chinese"
    EMBEDDING_DIMENSION: int = 1024
    
    # LLM配置
    MIMO_API_KEY: str = ""
    MIMO_API_BASE: str = "https://token-plan-cn.xiaomimimo.com/v1"
    MIMO_MODEL: str = "mimo-v2.6-pro"
    
    # 文件存储配置
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # 文档处理配置
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    # HuggingFace镜像
    HF_ENDPOINT: str = "https://hf-mirror.com"
    
    # 搜索配置
    SEARCH_TOP_K: int = 5
    HYBRID_SEARCH_WEIGHT: float = 0.7  # 语义搜索权重
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# 确保目录存在
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
