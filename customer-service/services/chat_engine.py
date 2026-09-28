"""
AI对话引擎 - RAG + 意图路由
"""
import httpx
import json
import logging
from typing import Dict, List, Optional
from config import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, KB_API_URL
from services.intent_service import classify_intent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个专业的智能客服助手。请根据以下知识库内容回答用户问题。

规则：
1. 优先使用知识库中的信息回答
2. 回答要简洁、准确、友好
3. 如果知识库中没有相关内容，如实告知并建议转人工
4. 涉及投诉、退款等敏感操作，引导用户转人工处理
5. 回答控制在200字以内

知识库内容：
{context}

用户问题：{question}"""


async def chat_with_rag(question: str, session_history: List[Dict] = None) -> Dict:
    """RAG对话"""
    # 1. 意图识别
    intent = classify_intent(question)
    logger.info(f"意图识别: {intent['intent']} (触发词: {intent.get('trigger')})")
    
    # 2. 根据意图路由
    if intent["intent"] == "transfer_human":
        return {
            "answer": "好的，正在为您转接人工客服，请稍候...",
            "action": "transfer_human",
            "intent": intent,
            "citations": []
        }
    
    if intent["intent"] == "complaint":
        return {
            "answer": "非常抱歉给您带来了不好的体验。您的问题我已记录，正在为您转接人工客服处理，请稍候...",
            "action": "transfer_human",
            "intent": intent,
            "citations": []
        }
    
    if intent["intent"] == "greeting":
        return {
            "answer": "您好！我是智能客服助手，请问有什么可以帮您？",
            "action": "reply",
            "intent": intent,
            "citations": []
        }
    
    if intent["intent"] == "farewell":
        return {
            "answer": "感谢您的咨询！如有其他问题随时联系我们，祝您生活愉快！",
            "action": "reply",
            "intent": intent,
            "citations": []
        }
    
    # 3. 知识库检索
    context = ""
    citations = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{KB_API_URL}/search/",
                json={"query": question, "search_type": "hybrid", "top_k": 3}
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                for r in results:
                    context += r.get("content", "") + "\n"
                    citations.append({
                        "filename": r.get("metadata", {}).get("filename", ""),
                        "score": r.get("score", 0)
                    })
    except Exception as e:
        logger.warning(f"知识库检索失败: {e}")
    
    # 4. LLM生成回答
    system_msg = SYSTEM_PROMPT.format(
        context=context if context else "（知识库中暂无相关内容）",
        question=question
    )
    
    messages = [{"role": "system", "content": system_msg}]
    
    # 添加历史对话（最近5条）
    if session_history:
        for h in session_history[-5:]:
            messages.append({
                "role": "assistant" if h.get("role") == "ai" else "user",
                "content": h.get("content", "")
            })
    
    messages.append({"role": "user", "content": question})
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": LLM_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            )
            data = resp.json()
            answer = data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"LLM调用失败: {e}")
        answer = "抱歉，系统暂时繁忙，请稍后再试或转人工客服。"
    
    return {
        "answer": answer,
        "action": "reply",
        "intent": intent,
        "citations": citations[:3]
    }
