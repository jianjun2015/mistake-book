"""
语义缓存服务 - 相似问题直接命中缓存，秒回
"""
import hashlib
import time
from typing import Optional, Dict, List

# 问答缓存 (question_hash -> answer)
_answer_cache: Dict[str, Dict] = {}
# 简单文本相似度缓存
_question_cache: Dict[str, str] = {}  # normalized_question -> hash


def _normalize(text: str) -> str:
    """归一化问题文本"""
    return text.strip().lower().replace(" ", "").replace("？", "").replace("?", "").replace("。", "")


def _hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:12]


def get_cached_answer(question: str) -> Optional[Dict]:
    """查询缓存"""
    norm = _normalize(question)
    qhash = _hash(norm)
    
    # 精确匹配
    if qhash in _answer_cache:
        entry = _answer_cache[qhash]
        if time.time() - entry["time"] < 3600:  # 1小时有效
            entry["hits"] += 1
            return entry["data"]
    
    # 相似匹配（包含关系）
    for key, q in _question_cache.items():
        if norm in q or q in norm:
            if key in _answer_cache:
                entry = _answer_cache[key]
                if time.time() - entry["time"] < 3600:
                    entry["hits"] += 1
                    return entry["data"]
    
    return None


def cache_answer(question: str, answer_data: Dict):
    """缓存回答"""
    norm = _normalize(question)
    qhash = _hash(norm)
    
    _answer_cache[qhash] = {
        "data": answer_data,
        "time": time.time(),
        "hits": 0
    }
    _question_cache[qhash] = norm
    
    # 限制缓存大小
    if len(_answer_cache) > 500:
        # 删除最旧的
        oldest = min(_answer_cache.items(), key=lambda x: x[1]["time"])
        del _answer_cache[oldest[0]]


def get_stats() -> Dict:
    """缓存统计"""
    total_hits = sum(e["hits"] for e in _answer_cache.values())
    return {
        "cached_questions": len(_answer_cache),
        "total_hits": total_hits
    }
