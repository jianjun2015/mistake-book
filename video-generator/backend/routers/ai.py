"""AI-powered prompt polishing and script-to-storyboard generation."""
import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# MiMo LLM config
MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1"
MIMO_API_KEY = os.environ.get("XIAOMI_API_KEY", os.environ.get("MIMO_API_KEY", ""))
MIMO_MODEL = "mimo-v2.6-pro"


class PolishRequest(BaseModel):
    prompt: str


class StoryboardRequest(BaseModel):
    script: str  # 剧本/故事文本
    scene_count: int = 5  # 目标镜头数
    style: str = ""  # 风格偏好


async def _call_llm(system: str, user: str) -> str:
    """Call MiMo LLM."""
    api_key = MIMO_API_KEY
    if not api_key:
        # Try reading from config file
        try:
            cfg_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'config', 'mimo_key.txt')
            if os.path.exists(cfg_path):
                api_key = open(cfg_path).read().strip()
        except Exception:
            pass

    if not api_key:
        raise HTTPException(status_code=500, detail="MiMo API Key 未配置 (环境变量 MIMO_API_KEY)")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{MIMO_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": MIMO_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"LLM 调用失败: {resp.status_code} {resp.text[:200]}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


@router.post("/polish")
async def polish_prompt(req: PolishRequest):
    """AI 润色提示词 — 扩写细节、优化结构、增强画面感。"""
    system = """你是一位专业的 AI 视频提示词工程师。你的任务是润色用户的视频生成提示词。

润色规则：
1. 保留用户原始意图和核心元素
2. 增加画面细节（光影、色彩、材质、构图）
3. 补充电影级术语（镜头运动、景深、色调）
4. 优化语句流畅度和专业感
5. 输出适合文生视频模型的提示词格式
6. 输出一个润色后的提示词，不要输出解释
7. 长度控制在 50-200 字

直接输出润色后的提示词，不要有任何前缀、解释或引号。"""

    result = await _call_llm(system, req.prompt)
    return {"original": req.prompt, "polished": result.strip()}


@router.post("/storyboard")
async def generate_storyboard(req: StoryboardRequest):
    """根据剧本/故事文本一键生成分镜脚本。"""
    system = """你是一位专业的视频分镜师。根据用户的剧本/故事，拆分成视频分镜脚本。

每个分镜包含：
- shot_id: 镜头编号
- camera: 镜头类型（远景/全景/中景/近景/特写/航拍/俯拍/仰拍/环绕/跟拍等）
- description: 画面描述（详细、可直接作为视频生成提示词）
- duration: 建议时长(秒)
- transition: 转场效果（切/淡入/淡出/叠化/闪白/缩放）
- dialogue: 台词/旁白（如有）
- mood: 氛围/情绪

输出 JSON 数组格式，不要输出解释。示例：
[
  {
    "shot_id": 1,
    "camera": "远景",
    "description": "夕阳下的城市天际线，金色阳光洒在玻璃幕墙上",
    "duration": 5,
    "transition": "淡入",
    "dialogue": "",
    "mood": "宁静壮观"
  }
]"""

    user = f"剧本/故事：\n{req.script}\n\n请拆分成 {req.scene_count} 个镜头。"
    if req.style:
        user += f"\n风格要求：{req.style}"

    result = await _call_llm(system, user)

    # Parse JSON from response
    try:
        # Try to extract JSON array from response
        text = result.strip()
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        shots = json.loads(text)
    except (json.JSONDecodeError, IndexError):
        # Fallback: try to find JSON in text
        import re
        match = re.search(r'\[.*\]', result, re.DOTALL)
        if match:
            try:
                shots = json.loads(match.group())
            except json.JSONDecodeError:
                raise HTTPException(status_code=502, detail=f"LLM 输出格式错误: {result[:200]}")
        else:
            raise HTTPException(status_code=502, detail=f"LLM 输出格式错误: {result[:200]}")

    return {
        "script": req.script,
        "shots": shots,
        "total_shots": len(shots),
        "total_duration": sum(s.get("duration", 5) for s in shots),
    }


@router.post("/enhance-shot")
async def enhance_shot(req: PolishRequest):
    """优化单个分镜的画面描述，使其更适合视频生成。"""
    system = """你是一位专业的视频提示词工程师。将用户的简短画面描述扩展为详细的视频生成提示词。

要求：
1. 增加视觉细节（光线、色彩、质感、构图）
2. 添加镜头运动描述
3. 补充氛围和情绪词
4. 输出 30-100 字的中文提示词
5. 直接输出提示词，不要解释

直接输出增强后的提示词。"""

    result = await _call_llm(system, req.prompt)
    return {"original": req.prompt, "enhanced": result.strip()}
