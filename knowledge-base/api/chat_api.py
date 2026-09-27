"""
智能问答API
"""
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest
from services.rag_engine import get_rag_engine
from utils import database as db

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", summary="RAG问答")
async def chat(req: ChatRequest):
    """基于知识库的智能问答"""
    if not req.question or not req.question.strip():
        raise HTTPException(400, "问题不能为空")
    
    logger.info(f"RAG问答: {req.question[:50]}")
    rag = get_rag_engine()
    
    # 获取历史
    history = []
    if req.conversation_id:
        msgs = db.get_conversation_messages(req.conversation_id)
        history = [{"role": m["role"], "content": m["content"]} for m in msgs]
    
    # 调用RAG
    result = await rag.chat(
        req.question,
        req.conversation_id,
        history,
        use_rag=req.use_rag
    )
    
    # 保存消息
    cid = result["conversation_id"]
    if not req.conversation_id:
        db.create_conversation(cid, title=req.question[:30])
    db.add_message(cid, "user", req.question)
    db.add_message(cid, "assistant", result["answer"], result["citations"])
    
    return result


@router.get("/conversations", summary="会话列表")
async def list_conversations():
    return db.list_conversations()


@router.get("/conversations/{cid}", summary="会话历史")
async def get_conversation(cid: str):
    return db.get_conversation_messages(cid)
