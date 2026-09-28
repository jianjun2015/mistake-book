"""
智能客服API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from services.session_service import create_session, get_session, update_session, close_session, list_sessions
from services.message_service import add_message, get_messages
from services.chat_engine import chat_with_rag

logger = logging.getLogger(__name__)
router = APIRouter()


class SessionCreate(BaseModel):
    user_id: str
    user_name: str = ""
    channel: str = "web"


class MessageSend(BaseModel):
    content: str
    msg_type: str = "text"


class TransferRequest(BaseModel):
    reason: str = "user_request"


class SatisfactionRequest(BaseModel):
    score: int
    comment: str = ""


# ========== 用户端 ==========

@router.post("/sessions", summary="创建会话")
async def create(data: SessionCreate):
    session = create_session(data.user_id, data.user_name, data.channel)
    # 自动添加欢迎消息
    add_message(session["id"], "system", "会话已创建，智能客服为您服务", "system")
    return session


@router.get("/sessions/{session_id}", summary="获取会话")
async def get(session_id: int):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    return session


@router.get("/sessions/{session_id}/messages", summary="获取消息历史")
async def messages(session_id: int, limit: int = 50, offset: int = 0):
    return get_messages(session_id, limit, offset)


@router.post("/sessions/{session_id}/messages", summary="发送消息")
async def send_message(session_id: int, data: MessageSend):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    
    if session["status"] == "closed":
        raise HTTPException(400, "会话已关闭")
    
    # 保存用户消息
    user_msg = add_message(session_id, "user", data.content, data.msg_type)
    
    # 人工处理中或等待人工 → 不走AI，消息发给客服
    if session["status"] in ("human_handling", "waiting_human"):
        return {"user_message": user_msg, "ai_reply": None, "action": "waiting_agent"}
    
    # AI自动回复
    history = get_messages(session_id, limit=10)
    rag_result = await chat_with_rag(data.content, history)
    
    ai_msg = add_message(
        session_id, "ai", rag_result["answer"], "text",
        {"citations": rag_result["citations"], "intent": rag_result["intent"]}
    )
    
    # 需要转人工
    if rag_result["action"] == "transfer_human":
        add_message(session_id, "system", "正在为您转接人工客服...", "system")
        update_session(session_id, {"status": "waiting_human"})
    
    return {
        "user_message": user_msg,
        "ai_reply": ai_msg,
        "action": rag_result["action"],
        "citations": rag_result["citations"]
    }


@router.post("/sessions/{session_id}/agent-followup", summary="客服追问")
async def agent_followup(session_id: int):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    if session["status"] != "human_handling":
        raise HTTPException(400, "当前不在人工服务中")
    add_message(session_id, "agent", "您好，请问还在吗？如果60秒内没有回复，本次人工服务将自动结束。", "text")
    return {"status": "followup_sent"}

@router.post("/sessions/{session_id}/auto-close", summary="自动关闭人工会话")
async def auto_close(session_id: int):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    if session["status"] != "human_handling":
        raise HTTPException(400, "当前不在人工服务中")
    update_session(session_id, {"status": "active"})
    add_message(session_id, "system", "由于长时间未收到回复，人工服务已自动结束，恢复AI对话。", "system")
    return {"status": "active"}

@router.post("/sessions/{session_id}/rename", summary="重命名会话")
async def rename_session(session_id: int, data: dict = None):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    name = (data or {}).get("name", "")
    if not name:
        raise HTTPException(400, "名称不能为空")
    update_session(session_id, {"user_name": name})
    return {"status": "ok", "user_name": name}

@router.post("/sessions/{session_id}/end-human", summary="结束人工，恢复AI")
async def end_human(session_id: int):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    if session["status"] not in ("waiting_human", "human_handling"):
        raise HTTPException(400, "当前不在人工服务中")
    update_session(session_id, {"status": "active"})
    add_message(session_id, "system", "人工服务已结束，恢复AI对话", "system")
    return {"status": "active"}

@router.post("/sessions/{session_id}/transfer", summary="转人工")
async def transfer(session_id: int, data: TransferRequest):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    
    add_message(session_id, "system", f"用户请求转人工: {data.reason}", "system")
    update_session(session_id, {"status": "waiting_human"})
    return {"status": "waiting_human"}


@router.post("/sessions/{session_id}/satisfaction", summary="满意度评价")
async def satisfaction(session_id: int, data: SatisfactionRequest):
    if data.score < 1 or data.score > 5:
        raise HTTPException(400, "评分必须在1-5之间")
    
    add_message(session_id, "system", f"用户评价: {'★' * data.score}{'☆' * (5 - data.score)} {data.comment}", "system")
    update_session(session_id, {"satisfaction": data.score})
    return {"status": "ok"}


# ========== 客服工作台 ==========

@router.get("/agent/sessions", summary="客服-会话列表")
async def agent_sessions(status: str = None, page: int = 1, size: int = 20):
    return list_sessions(status=status, page=page, size=size)


@router.post("/agent/sessions/{session_id}/reply", summary="客服-回复")
async def agent_reply(session_id: int, data: MessageSend):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    
    msg = add_message(session_id, "agent", data.content, data.msg_type)
    
    # 更新会话状态
    if session["status"] == "waiting_human":
        update_session(session_id, {"status": "human_handling"})
    
    return msg


@router.post("/agent/sessions/{session_id}/close", summary="客服-关闭会话")
async def agent_close(session_id: int):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "会话不存在")
    
    add_message(session_id, "system", "会话已关闭", "system")
    close_session(session_id)
    return {"status": "closed"}


# ========== 管理端 ==========

@router.get("/stats", summary="数据统计")
async def stats():
    from utils.database import get_db
    with get_db() as db:
        db.execute("SELECT COUNT(*) as total FROM cs_sessions")
        total_sessions = db.fetchone()["total"]
        
        db.execute("SELECT COUNT(*) as active FROM cs_sessions WHERE status IN ('active','waiting_human','human_handling')")
        active_sessions = db.fetchone()["active"]
        
        db.execute("SELECT AVG(satisfaction) as avg_sat FROM cs_sessions WHERE satisfaction IS NOT NULL")
        avg_sat = db.fetchone()["avg_sat"] or 0
        
        db.execute("SELECT COUNT(*) as total FROM cs_messages WHERE role='ai'")
        ai_messages = db.fetchone()["total"]
        
        db.execute("SELECT COUNT(*) as total FROM cs_tickets")
        total_tickets = db.fetchone()["total"]
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "avg_satisfaction": round(avg_sat, 1),
            "ai_messages": ai_messages,
            "total_tickets": total_tickets
        }
