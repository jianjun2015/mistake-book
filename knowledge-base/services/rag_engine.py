"""
RAG问答引擎 - 检索增强生成
"""
import uuid
import json
import httpx
from typing import List, Dict, Any, Optional
from config.settings import settings
from services.vector_store import get_vector_store


class LLMClient:
    """LLM客户端 - 支持MiMo/OpenAI兼容接口"""
    
    def __init__(self):
        self.api_key = settings.MIMO_API_KEY
        self.api_base = settings.MIMO_API_BASE
        self.model = settings.MIMO_MODEL
    
    async def generate(self, messages: List[Dict[str, str]], 
                       temperature: float = 0.7,
                       max_tokens: int = 1500) -> str:
        """调用LLM生成"""
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class RAGEngine:
    """RAG问答引擎"""
    
    def __init__(self):
        self.vector_store = get_vector_store()
        self.llm = LLMClient()
    
    async def answer(self, question: str, 
                     conversation_id: str = None,
                     history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        基于知识库的问答
        """
        # 1. 检索相关文档
        sources = self.vector_store.hybrid_search(question, top_k=settings.SEARCH_TOP_K)
        
        # 2. 构建提示词
        prompt = self._build_prompt(question, sources)
        
        # 3. 构建消息（含历史）
        messages = []
        if history:
            for h in history[-6:]:  # 保留最近3轮
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})
        
        # 4. 调用LLM
        answer_text = await self.llm.generate(messages)
        
        # 5. 提取引用
        citations = self._extract_citations(answer_text, sources)
        
        return {
            "answer": answer_text,
            "conversation_id": conversation_id or str(uuid.uuid4()),
            "citations": citations,
            "sources": sources
        }
    
    async def chat(self, message: str,
                   conversation_id: str = None,
                   history: List[Dict[str, str]] = None,
                   use_rag: bool = True) -> Dict[str, Any]:
        """
        对话接口 - 可选RAG
        """
        if not use_rag:
            messages = []
            if history:
                for h in history[-6:]:
                    messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": message})
            
            answer_text = await self.llm.generate(messages)
            return {
                "answer": answer_text,
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "citations": [],
                "sources": []
            }
        
        return await self.answer(message, conversation_id, history)
    
    def _build_prompt(self, question: str, sources: List[Dict[str, Any]]) -> str:
        """构建RAG提示词"""
        if not sources:
            return f"""请直接回答以下问题。如果不确定，请说明。

问题：{question}

答案："""
        
        context_parts = []
        for i, s in enumerate(sources):
            meta = s.get("metadata", {})
            filename = meta.get("filename", "未知来源")
            context_parts.append(f"[{i+1}] (来源: {filename})\n{s['content']}")
        
        context = "\n\n".join(context_parts)
        
        return f"""你是一个智能知识库助手。请严格基于以下参考内容回答问题，并标注引用来源。

参考内容：
{context}

问题：{question}

回答要求：
1. 优先基于参考内容回答
2. 引用时使用 [1] [2] 等编号标注来源
3. 如果参考内容不足以回答，请明确说明"知识库中没有找到相关信息"，然后给出你的通用回答
4. 保持回答简洁准确

答案："""
    
    def _extract_citations(self, answer: str, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """提取答案中的引用"""
        import re
        citations = []
        # 找出 [1] [2] 等引用
        ref_pattern = re.compile(r'\[(\d+)\]')
        used_refs = set(int(m) for m in ref_pattern.findall(answer))
        
        for ref_num in used_refs:
            idx = ref_num - 1
            if 0 <= idx < len(sources):
                s = sources[idx]
                citations.append({
                    "index": ref_num,
                    "content": s["content"][:200],
                    "filename": s.get("metadata", {}).get("filename", "未知"),
                    "score": s.get("score", 0)
                })
        return citations


# 全局单例
_rag_engine = None


def get_rag_engine() -> RAGEngine:
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine
