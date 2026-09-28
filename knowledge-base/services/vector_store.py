"""
向量存储服务 - ChromaDB
"""
import uuid
import chromadb
from typing import List, Dict, Any, Optional
from config.settings import settings
from services.embedding_service import get_embedding_service


class VectorStore:
    """向量存储"""
    
    def __init__(self, collection_name: str = None):
        self.name = collection_name or settings.CHROMA_COLLECTION
        # ChromaDB内存优化：限制缓存大小
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=chromadb.Settings(
                anonymized_telemetry=False,
                persist_directory=settings.CHROMA_PERSIST_DIR
            )
        )
        self.embedder = get_embedding_service()
        
        # 使用自定义embedding函数，避免ChromaDB下载默认模型
        from chromadb import Documents, EmbeddingFunction, Embeddings
        
        class LocalEmbeddingFunction(EmbeddingFunction):
            def __init__(self, embedder):
                self._embedder = embedder
            def __call__(self, input: Documents) -> Embeddings:
                return self._embedder.encode(list(input))
        
        self._ef = LocalEmbeddingFunction(self.embedder)
        self.collection = self.client.get_or_create_collection(
            name=self.name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._ef
        )
    
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """批量添加文档分块"""
        if not chunks:
            return []
        
        contents = [c["content"] for c in chunks]
        embeddings = self.embedder.encode(contents)
        
        ids = [c.get("id") or str(uuid.uuid4()) for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=contents,
            metadatas=metadatas
        )
        return ids
    
    def add_chunk(self, content: str, metadata: Dict[str, Any] = None) -> str:
        """添加单个分块"""
        ids = self.add_chunks([{
            "content": content,
            "metadata": metadata or {}
        }])
        return ids[0]
    
    def search(self, query: str, top_k: int = 5, 
               where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """语义搜索"""
        query_embedding = self.embedder.encode_single(query)
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": top_k
        }
        if where:
            kwargs["where"] = where
        
        results = self.collection.query(**kwargs)
        return self._format_results(results)
    
    def keyword_search(self, query: str, top_k: int = 5,
                       where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """关键词搜索（使用where_document过滤，避免触发ChromaDB内置模型）"""
        # 提取关键词
        keywords = [k.strip() for k in query.split() if len(k.strip()) >= 2]
        if not keywords:
            keywords = [query]
        
        # 使用 $or 组合多个关键词的 $contains
        or_conditions = [{"$contains": kw} for kw in keywords]
        doc_filter = {"$or": or_conditions} if len(or_conditions) > 1 else or_conditions[0]
        
        kwargs = {
            "where_document": doc_filter,
            "n_results": top_k
        }
        if where:
            kwargs["where"] = where
        
        # ChromaDB的get方法支持where_document，不触发embedding
        try:
            results = self.collection.get(**kwargs)
            return self._format_get_results(results)
        except Exception:
            # 回退到语义搜索
            return self.search(query, top_k, where)
    
    def hybrid_search(self, query: str, top_k: int = 5,
                      where: Optional[Dict[str, Any]] = None,
                      semantic_weight: float = None) -> List[Dict[str, Any]]:
        """混合搜索（语义 + 关键词），使用RRF融合"""
        if semantic_weight is None:
            semantic_weight = settings.HYBRID_SEARCH_WEIGHT
        
        # 多取一些用于融合
        fetch_k = top_k * 3
        semantic_results = self.search(query, fetch_k, where)
        keyword_results = self.keyword_search(query, fetch_k, where)
        
        # RRF (Reciprocal Rank Fusion) 融合
        k = 60
        scores: Dict[str, float] = {}
        docs: Dict[str, Dict[str, Any]] = {}
        
        for rank, r in enumerate(semantic_results):
            rid = r["id"]
            scores[rid] = scores.get(rid, 0) + semantic_weight / (k + rank + 1)
            docs[rid] = r
        
        for rank, r in enumerate(keyword_results):
            rid = r["id"]
            scores[rid] = scores.get(rid, 0) + (1 - semantic_weight) / (k + rank + 1)
            docs[rid] = r
        
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        
        results = []
        for rid, score in ranked:
            d = docs[rid]
            d["score"] = score
            results.append(d)
        
        return results
    
    def delete_by_document(self, document_id: str):
        """删除指定文档的所有分块"""
        self.collection.delete(where={"document_id": document_id})
    
    def count(self) -> int:
        """分块总数"""
        return self.collection.count()
    
    def _format_get_results(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        """格式化ChromaDB get()结果"""
        results = []
        if not raw or not raw.get("ids"):
            return results
        
        for i, doc_id in enumerate(raw["ids"]):
            results.append({
                "id": doc_id,
                "content": raw["documents"][i] if raw.get("documents") else "",
                "metadata": raw["metadatas"][i] if raw.get("metadatas") else {},
                "score": 1.0  # 关键词搜索固定分数
            })
        return results
    
    def _format_results(self, raw: Dict[str, Any]) -> List[Dict[str, Any]]:
        """格式化ChromaDB查询结果"""
        results = []
        if not raw or not raw.get("ids") or not raw["ids"][0]:
            return results
        
        for i, doc_id in enumerate(raw["ids"][0]):
            distance = raw["distances"][0][i] if raw.get("distances") else 0
            # cosine距离转相似度
            score = 1 - distance
            results.append({
                "id": doc_id,
                "content": raw["documents"][0][i] if raw.get("documents") else "",
                "metadata": raw["metadatas"][0][i] if raw.get("metadatas") else {},
                "score": score
            })
        return results


# 全局单例
_vector_store = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
