"""
SSE流式对话API
"""
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import json
import httpx
import logging
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, KB_API_URL
from services.intent_service import classify_intent
from services.cache_service import get_cached_answer, cache_answer
from services.chat_engine import _match_faq, SYSTEM_PROMPT

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/sessions/{session_id}/stream")
async def stream_chat(session_id: int, request: Request):
    from services.session_service import get_session
    from services.message_service import add_message
    
    body = await request.json()
    question = body.get("content", "")
    
    session = get_session(session_id)

    async def generate():
        # 人工接管后不走AI
        if session and session.get("status") in ("human_handling", "waiting_human"):
            add_message(session_id, "user", question, "text")
            yield f"data: {json.dumps({'type':'text','content':'您的消息已发送给人工客服，请稍候回复。'})}\n\n"
            yield f"data: {json.dumps({'type':'done','action':'waiting_agent','citations':[]})}\n\n"
            return
        
        intent = classify_intent(question)
        instant = {
            "transfer_human": ("好的，正在为您转接人工客服，请稍候...", "transfer_human"),
            "complaint": ("非常抱歉。正在为您转接人工客服处理，请稍候...", "transfer_human"),
            "greeting": ("您好！我是智能客服助手，请问有什么可以帮您？", "reply"),
            "farewell": ("感谢您的咨询！祝您生活愉快！", "reply"),
        }
        if intent["intent"] in instant:
            ans, act = instant[intent["intent"]]
            yield f"data: {json.dumps({'type':'text','content':ans})}\n\n"
            yield f"data: {json.dumps({'type':'done','action':act,'citations':[]})}\n\n"
            return

        cached = get_cached_answer(question)
        if cached:
            yield f"data: {json.dumps({'type':'text','content':cached['answer']})}\n\n"
            yield f"data: {json.dumps({'type':'done','action':cached.get('action','reply'),'citations':cached.get('citations',[])})}\n\n"
            return

        faq = _match_faq(question)
        if faq:
            act = "transfer_human" if "转接人工" in faq else "reply"
            cache_answer(question, {"answer": faq, "action": act, "citations": []})
            yield f"data: {json.dumps({'type':'text','content':faq})}\n\n"
            yield f"data: {json.dumps({'type':'done','action':act,'citations':[]})}\n\n"
            return

        ctx = ""
        cites = []
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.post(f"{KB_API_URL}/search/", json={"query": question, "search_type": "hybrid", "top_k": 3})
                if r.status_code == 200:
                    for x in r.json().get("results", []):
                        ctx += x.get("content", "")[:200] + "\n"
                        cites.append({"filename": x.get("metadata", {}).get("filename", ""), "score": x.get("score", 0)})
        except Exception as e:
            logger.warning(f"KB: {e}")

        sys_msg = SYSTEM_PROMPT.format(context=ctx or "(无内容)", question=question)
        msgs = [{"role": "system", "content": sys_msg}, {"role": "user", "content": question}]
        full = ""
        try:
            async with httpx.AsyncClient(timeout=60) as c:
                async with c.stream("POST", f"{LLM_BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"},
                    json={"model": LLM_MODEL, "messages": msgs, "temperature": 0.3, "max_tokens": 150, "stream": True}
                ) as resp:
                    async for line in resp.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                d = json.loads(line[6:])
                                delta = d.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if delta:
                                    full += delta
                                    yield f"data: {json.dumps({'type':'text','content':delta})}\n\n"
                            except:
                                pass
        except Exception as e:
            logger.error(f"LLM: {e}")
            if not full:
                yield f"data: {json.dumps({'type':'text','content':'抱歉，系统繁忙。'})}\n\n"

        if full and "抱歉" not in full:
            cache_answer(question, {"answer": full, "action": "reply", "citations": cites})
        yield f"data: {json.dumps({'type':'done','action':'reply','citations':cites[:3]})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
