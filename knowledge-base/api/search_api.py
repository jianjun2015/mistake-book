"""
知识检索API
"""
import time
from fastapi import APIRouter, HTTPException
from models.schemas import SearchRequest
from services.vector_store import get_vector_store

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", summary="混合搜索")
async def search(req: SearchRequest):
    """语义 + 关键词混合搜索"""
    if not req.query or not req.query.strip():
        raise HTTPException(400, "查询内容不能为空")
    
    logger.info(f"搜索[{req.search_type}]: {req.query[:50]}")
    start = time.time()
    vs = get_vector_store()
    
    if req.search_type == "semantic":
        results = vs.search(req.query, req.top_k, req.filters)
    elif req.search_type == "keyword":
        results = vs.keyword_search(req.query, req.top_k, req.filters)
    else:
        results = vs.hybrid_search(req.query, req.top_k, req.filters)
    
    latency = (time.time() - start) * 1000
    logger.info(f"搜索完成: {len(results)}条结果, {latency:.0f}ms")
    return {
        "query": req.query,
        "results": results,
        "total": len(results),
        "latency_ms": latency
    }


@router.post("/semantic", summary="语义搜索")
async def semantic_search(req: SearchRequest):
    req.search_type = "semantic"
    return await search(req)


@router.post("/keyword", summary="关键词搜索")
async def keyword_search(req: SearchRequest):
    req.search_type = "keyword"
    return await search(req)


@router.post("/hybrid", summary="混合搜索")
async def hybrid_search(req: SearchRequest):
    req.search_type = "hybrid"
    return await search(req)
