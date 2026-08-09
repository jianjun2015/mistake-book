"""
代码助手服务 - 基于 AgentScope 多智能体框架
提供需求分析、代码生成、代码审查、测试生成等功能
"""
import os
import re
import json
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ 请求/响应模型 ============

class CodeRequest(BaseModel):
    requirement: str
    language: str = "java"
    context: Optional[str] = None

class ReviewRequest(BaseModel):
    code: str
    language: str = "java"

class ChatRequest(BaseModel):
    message: str
    role: str = "coder"  # analyst / coder / reviewer / tester
    language: str = "java"

class PipelineRequest(BaseModel):
    requirement: str
    language: str = "java"
    max_review_rounds: int = 2


# ============ Agent 定义 ============

# Agent 系统提示词
AGENTS = {
    "analyst": {
        "name": "需求分析师",
        "prompt": """你是一个高级需求分析师，专注于软件开发需求。

职责：
1. 理解用户的开发需求，拆解成功能点
2. 识别技术约束和边界条件
3. 输出结构化的需求文档

输出格式：
## 功能概述
（一句话描述）

## 功能点列表
1. 功能点1：描述
2. 功能点2：描述
...

## 技术约束
- 约束1
- 约束2

## 输入输出
- 输入：xxx
- 输出：xxx
"""
    },
    "coder": {
        "name": "高级程序员",
        "prompt": """你是一个资深全栈开发工程师。

职责：
1. 根据需求设计代码结构
2. 编写高质量、可维护的代码
3. 遵循最佳实践和设计模式

规则：
- 代码必须有清晰的注释
- 遵循语言编码规范
- 处理异常和边界情况
- 使用有意义的命名

输出格式：直接输出代码，用```语言名 包裹代码块。
"""
    },
    "reviewer": {
        "name": "代码审查员",
        "prompt": """你是一个严格的代码审查专家。

审查要点：
1. 代码风格和规范
2. 潜在的Bug和安全漏洞
3. 性能问题
4. 可读性和可维护性
5. 设计模式和架构

输出格式：
## 审查结果

### 问题列表
1. [严重] 问题描述 - 位置
2. [警告] 问题描述 - 位置
3. [建议] 问题描述 - 位置

### 优点
- xxx

### 总体评分
X/10

### 修改建议
1. 建议1
2. 建议2
"""
    },
    "tester": {
        "name": "测试工程师",
        "prompt": """你是一个专业的测试工程师。

职责：
1. 根据代码生成单元测试
2. 覆盖正常流程和异常场景
3. 测试边界条件

规则：
- 使用标准测试框架（JUnit5/pytest/Jest等）
- 测试命名清晰
- 每个测试方法只测一个场景
- 包含断言验证

输出格式：直接输出测试代码，用```语言名 包裹。
"""
    },
    "debugger": {
        "name": "调试专家",
        "prompt": """你是一个调试专家，擅长定位和修复代码问题。

职责：
1. 分析错误信息和堆栈
2. 定位问题根因
3. 提供修复方案

输出格式：
## 问题分析
（分析错误原因）

## 根因
（根本原因）

## 修复方案
（具体修复步骤和代码）
"""
    }
}


class SimpleAgent:
    """简单的 Agent 封装，使用大模型 API"""
    
    def __init__(self, agent_type: str):
        self.config = AGENTS[agent_type]
        self.name = self.config["name"]
        self.system_prompt = self.config["prompt"]
        self.history = []
    
    async def chat(self, user_message: str, context: Optional[str] = None) -> str:
        """与 Agent 对话"""
        import httpx
        
        api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("API_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
        model = os.getenv("MODEL_NAME", "qwen-plus")
        
        messages = [{"role": "system", "content": self.system_prompt}]
        
        if context:
            messages.append({"role": "user", "content": f"上下文信息：\n{context}"})
            messages.append({"role": "assistant", "content": "收到上下文，我会参考这些信息。"})
        
        # 加入历史对话
        for h in self.history[-4:]:
            messages.append(h)
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 4096
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"API调用失败: {response.status_code} {response.text}")
                    raise HTTPException(status_code=500, detail=f"模型API调用失败: {response.status_code}")
                
                data = response.json()
                result = data["choices"][0]["message"]["content"]
                
                # 保存历史
                self.history.append({"role": "user", "content": user_message})
                self.history.append({"role": "assistant", "content": result})
                
                return result
                
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="模型响应超时")
        except Exception as e:
            logger.error(f"Agent调用异常: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def clear_history(self):
        """清除对话历史"""
        self.history = []


# ============ Agent 实例管理 ============

agent_pool = {}

def get_agent(agent_type: str) -> SimpleAgent:
    """获取或创建 Agent 实例"""
    if agent_type not in agent_pool:
        agent_pool[agent_type] = SimpleAgent(agent_type)
    return agent_pool[agent_type]


# ============ FastAPI 应用 ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 代码助手服务启动")
    logger.info(f"模型: {os.getenv('MODEL_NAME', 'qwen-plus')}")
    logger.info(f"API地址: {os.getenv('API_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')}")
    yield
    logger.info("代码助手服务关闭")

app = FastAPI(
    title="AI 代码助手",
    description="基于 AgentScope 的多智能体代码助手",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ API 端点 ============

@app.get("/")
async def root():
    return {
        "service": "AI 代码助手",
        "version": "1.0.0",
        "agents": list(AGENTS.keys())
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_requirement(request: CodeRequest):
    """需求分析"""
    agent = get_agent("analyst")
    prompt = f"编程语言：{request.language}\n\n需求描述：\n{request.requirement}"
    if request.context:
        prompt += f"\n\n补充上下文：\n{request.context}"
    
    result = await agent.chat(prompt)
    return {
        "success": True,
        "data": {"analysis": result}
    }


@app.post("/api/generate")
async def generate_code(request: CodeRequest):
    """生成代码"""
    agent = get_agent("coder")
    prompt = f"编程语言：{request.language}\n\n需求：\n{request.requirement}"
    if request.context:
        prompt += f"\n\n参考上下文：\n{request.context}"
    
    result = await agent.chat(prompt)
    return {
        "success": True,
        "data": {"code": result}
    }


@app.post("/api/review")
async def review_code(request: ReviewRequest):
    """代码审查"""
    agent = get_agent("reviewer")
    prompt = f"编程语言：{request.language}\n\n请审查以下代码：\n```\n{request.code}\n```"
    
    result = await agent.chat(prompt)
    return {
        "success": True,
        "data": {"review": result}
    }


@app.post("/api/test")
async def generate_tests(request: ReviewRequest):
    """生成测试"""
    agent = get_agent("tester")
    prompt = f"编程语言：{request.language}\n\n请为以下代码生成单元测试：\n```\n{request.code}\n```"
    
    result = await agent.chat(prompt)
    return {
        "success": True,
        "data": {"tests": result}
    }


@app.post("/api/debug")
async def debug_code(request: CodeRequest):
    """调试代码"""
    agent = get_agent("debugger")
    prompt = f"编程语言：{request.language}\n\n问题描述：\n{request.requirement}"
    if request.context:
        prompt += f"\n\n代码/错误信息：\n{request.context}"
    
    result = await agent.chat(prompt)
    return {
        "success": True,
        "data": {"solution": result}
    }


@app.post("/api/chat")
async def agent_chat(request: ChatRequest):
    """通用 Agent 对话"""
    if request.role not in AGENTS:
        raise HTTPException(status_code=400, detail=f"未知角色: {request.role}")
    
    agent = get_agent(request.role)
    result = await agent.chat(request.message)
    return {
        "success": True,
        "data": {"response": result}
    }


@app.post("/api/pipeline")
async def full_pipeline(request: PipelineRequest):
    """完整流水线：需求分析 → 代码生成 → 代码审查 → 测试生成"""
    try:
        results = {}
        
        # 1. 需求分析
        logger.info("📋 步骤1: 需求分析")
        analyst = get_agent("analyst")
        analysis = await analyst.chat(
            f"编程语言：{request.language}\n\n需求：\n{request.requirement}"
        )
        results["analysis"] = analysis
        
        # 2. 代码生成
        logger.info("💻 步骤2: 代码生成")
        coder = get_agent("coder")
        code = await coder.chat(
            f"编程语言：{request.language}\n\n需求分析结果：\n{analysis}",
            context=f"原始需求：{request.requirement}"
        )
        results["code"] = code
        
        # 3. 代码审查 (可多轮)
        logger.info("🔍 步骤3: 代码审查")
        reviewer = get_agent("reviewer")
        current_code = code
        
        for round_num in range(request.max_review_rounds):
            review = await reviewer.chat(
                f"编程语言：{request.language}\n\n请审查以下代码：\n```\n{current_code}\n```"
            )
            results[f"review_round_{round_num + 1}"] = review
            
            # 提取评分
            score_match = re.search(r'(\d+)/10', review)
            if score_match:
                score = int(score_match.group(1))
                if score >= 8:
                    logger.info(f"✅ 审查评分 {score}/10，通过")
                    break
            
            # 如果评分不高，让coder修改
            if round_num < request.max_review_rounds - 1:
                logger.info(f"⚠️ 审查评分不足，第{round_num + 2}轮修改")
                current_code = await coder.chat(
                    f"请根据审查意见修改代码：\n\n审查意见：\n{review}\n\n原代码：\n```\n{current_code}\n```"
                )
                results[f"code_round_{round_num + 2}"] = current_code
        
        results["final_code"] = current_code
        
        # 4. 生成测试
        logger.info("✅ 步骤4: 生成测试")
        tester = get_agent("tester")
        tests = await tester.chat(
            f"编程语言：{request.language}\n\n请为以下代码生成单元测试：\n```\n{current_code}\n```"
        )
        results["tests"] = tests
        
        return {
            "success": True,
            "data": results
        }
        
    except Exception as e:
        logger.error(f"流水线执行失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear-history")
async def clear_history(role: str = "all"):
    """清除 Agent 对话历史"""
    if role == "all":
        for agent in agent_pool.values():
            agent.clear_history()
    elif role in agent_pool:
        agent_pool[role].clear_history()
    else:
        raise HTTPException(status_code=400, detail=f"未知角色: {role}")
    
    return {"success": True, "message": "历史已清除"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
