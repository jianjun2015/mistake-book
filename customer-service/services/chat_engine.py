"""
AI对话引擎 - RAG + 意图路由 + 语义缓存 + 连接池
"""
import httpx
import time
import logging
from typing import Dict, List
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, KB_API_URL
from services.intent_service import classify_intent
from services.cache_service import get_cached_answer, cache_answer

logger = logging.getLogger(__name__)

# ============ 连接池（复用HTTP连接） ============
_kb_client: httpx.AsyncClient = None
_llm_client: httpx.AsyncClient = None

async def get_kb_client() -> httpx.AsyncClient:
    global _kb_client
    if _kb_client is None or _kb_client.is_closed:
        _kb_client = httpx.AsyncClient(
            timeout=httpx.Timeout(5.0, connect=2.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
        )
    return _kb_client

async def get_llm_client() -> httpx.AsyncClient:
    global _llm_client
    if _llm_client is None or _llm_client.is_closed:
        _llm_client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0, connect=5.0),
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=3),
            headers={"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"}
        )
    return _llm_client


# ============ FAQ快速缓存 ============
FAQ_CACHE = {
    "营业时间": "我们的服务时间是7×24小时全天候在线，人工客服工作时间为工作日 9:00-18:00。",
    "怎么退款": "关于退款问题，我为您转接人工客服处理，请稍候...",
    "怎么退货": "关于退货问题，我为您转接人工客服处理，请稍候...",
    "联系方式": "您可以通过在线客服、电话或邮件联系我们。",
    "怎么开发票": "关于发票问题，我为您转接人工客服处理，请稍候...",
    "修改密码": "关于账户问题，我为您转接人工客服处理，请稍候...",
    "运费": "运费根据商品和配送方式不同而有所差异，具体以订单页面显示为准。",
    "配送时间": "一般下单后1-3个工作日内发货，配送时间约2-5天。",
}

def _match_faq(question: str) -> str:
    q = question.lower().strip()
    for key, answer in FAQ_CACHE.items():
        if key in q:
            return answer
    return ""

SYSTEM_PROMPT = """你是智能客服。基于知识库简洁回答（100字内）。无答案建议转人工。

知识库：
{context}

问：{question}"""


async def chat_with_rag(question: str, session_history: List[Dict] = None) -> Dict:
    """RAG对话（多级缓存 + 连接池）"""
    # ===== Level 0: 意图路由（0ms） =====
    intent = classify_intent(question)
    instant_replies = {
        "transfer_human": ("好的，正在为您转接人工客服，请稍候...", "transfer_human"),
        "complaint": ("非常抱歉给您带来了不好的体验。正在为您转接人工客服处理，请稍候...", "transfer_human"),
        "greeting": ("您好！我是智能客服助手，请问有什么可以帮您？", "reply"),
        "farewell": ("感谢您的咨询！如有其他问题随时联系我们，祝您生活愉快！", "reply"),
    }
    if intent["intent"] in instant_replies:
        answer, action = instant_replies[intent["intent"]]
        return {"answer": answer, "action": action, "intent": intent, "citations": [], "source": "instant", "latency_ms": 0}
    
    # ===== Level 1: 语义缓存（<1ms） =====
    cached = get_cached_answer(question)
    if cached:
        logger.info("命中语义缓存")
        cached["source"] = "cache"
        cached["latency_ms"] = 1
        return cached
    
    # ===== Level 2: FAQ缓存（<5ms） =====
    faq_answer = _match_faq(question)
    if faq_answer:
        action = "transfer_human" if "转接人工" in faq_answer else "reply"
        result = {"answer": faq_answer, "action": action, "intent": intent, "citations": [], "source": "faq", "latency_ms": 5}
        cache_answer(question, result)
        return result
    
    # ===== Level 3: 知识库检索（~100ms） =====
    t0 = time.time()
    context = ""
    citations = []
    try:
        client = await get_kb_client()
        resp = await client.post(
            f"{KB_API_URL}/search/",
            json={"query": question, "search_type": "hybrid", "top_k": 3}
        )
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            for r in results:
                context += r.get("content", "")[:200] + "\n"
                citations.append({
                    "filename": r.get("metadata", {}).get("filename", ""),
                    "score": r.get("score", 0)
                })
    except Exception as e:
        logger.warning(f"知识库检索失败: {e}")
    kb_time = int((time.time() - t0) * 1000)
    
    # ===== Level 4: LLM生成（~5s） =====
    system_msg = SYSTEM_PROMPT.format(
        context=context if context else "（暂无相关内容）",
        question=question
    )
    
    messages = [{"role": "system", "content": system_msg}]
    if session_history:
        for h in session_history[-3:]:
            messages.append({
                "role": "assistant" if h.get("role") == "ai" else "user",
                "content": h.get("content", "")[:100]
            })
    messages.append({"role": "user", "content": question})
    
    t0 = time.time()
    try:
        client = await get_llm_client()
        resp = await client.post(
            f"{LLM_BASE_URL}/chat/completions",
            json={
                "model": LLM_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 150
            }
        )
        data = resp.json()
        answer = data["choices"][0]["message"]["content"]
        llm_time = int((time.time() - t0) * 1000)
        logger.info(f"LLM: {llm_time}ms, KB: {kb_time}ms")
    except Exception as e:
        llm_time = int((time.time() - t0) * 1000)
        logger.error(f"LLM失败({llm_time}ms): {e}")
        answer = "抱歉，系统繁忙，请稍后再试或转人工客服。"
    
    result = {
        "answer": answer,
        "action": "reply",
        "intent": intent,
        "citations": citations[:3],
        "source": "llm",
        "latency_ms": kb_time + llm_time
    }
    
    # 缓存LLM回答（供下次秒回）
    if answer and "抱歉" not in answer:
        cache_answer(question, result)
    
    return result
