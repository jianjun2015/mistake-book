"""
Embedding服务 - 文本向量化（稳定版）
使用 text2vec-base-chinese 轻量级中文语义模型
"""
import os
import numpy as np
from typing import List
from config.settings import settings

# 设置HuggingFace镜像
os.environ.setdefault("HF_ENDPOINT", settings.HF_ENDPOINT)
os.environ.setdefault("OMP_NUM_THREADS", "2")


class EmbeddingService:
    """Embedding服务"""
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def model(self):
        if self._model is None:
            self._load_model()
        return self._model
    
    def _load_model(self):
        """加载PyTorch模型（限制线程减少内存）"""
        import torch
        from sentence_transformers import SentenceTransformer
        
        torch.set_num_threads(2)
        self._model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            device="cpu"
        )
        print(f"✅ Embedding模型加载完成: {settings.EMBEDDING_MODEL}")
    
    @property
    def dimension(self) -> int:
        return 768
    
    def encode(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([])
        return self.model.encode(
            texts,
            batch_size=16,
            show_progress_bar=False,
            normalize_embeddings=True
        )
    
    def encode_single(self, text: str) -> List[float]:
        vec = self.encode([text])
        return vec[0].tolist()
    
    def warmup(self):
        try:
            self.encode(["预热"])
        except Exception:
            pass


_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


def preload_model():
    service = get_embedding_service()
    service.warmup()
    return service
