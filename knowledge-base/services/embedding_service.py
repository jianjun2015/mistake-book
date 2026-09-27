"""
Embedding服务 - 文本向量化
使用 text2vec-base-chinese 轻量级中文语义模型
"""
import os
import numpy as np
from typing import List
from config.settings import settings

# 设置HuggingFace镜像
os.environ.setdefault("HF_ENDPOINT", settings.HF_ENDPOINT)


class EmbeddingService:
    """文本向量化服务"""
    
    def __init__(self):
        self._model = None
        self._model_name = settings.EMBEDDING_MODEL
    
    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
        return self._model
    
    def encode(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """批量向量化"""
        if not texts:
            return []
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        return embeddings.tolist()
    
    def encode_single(self, text: str) -> List[float]:
        """单条向量化"""
        return self.encode([text])[0]
    
    @property
    def dimension(self) -> int:
        """向量维度"""
        return self.model.get_sentence_embedding_dimension()


# 全局单例（启动时预加载模型）
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


def preload_model():
    """预加载Embedding模型（减少首次请求延迟）"""
    service = get_embedding_service()
    _ = service.dimension  # 触发模型加载
    return service
