"""AI-powered prompt polishing and script-to-storyboard generation."""
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import llm_client
from backend.services.storyboard_local import build_storyboard

router = APIRouter()


class PolishRequest(BaseModel):
    prompt: str
    llm_model: str = ""


class StoryboardRequest(BaseModel):
    script: str  # 剧本/故事文本
    llm_model: str = ""
    scene_count: int = 5  # 目标镜头数
    style: str = ""  # 风格偏好
    tags: list[str] = []  # 已选标签（融入分镜描述）


async def _call_llm(system: str, user: str, model: str = "") -> tuple[str, str]:
    """多通道 LLM：优先通道（方舟 Coding 套餐 / MiMo）→ 另一通道。

    返回 (内容, 实际使用的模型)。全失败抛 LLMUnavailable。
    """
    return await llm_client.chat(system, user, model=model)


def _parse_shots(result: str) -> list[dict]:
    """从 LLM 输出里解析分镜 JSON 数组。"""
    text = result.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        import re
        m = re.search(r"\[.*\]", result, re.DOTALL)
        if not m:
            raise ValueError(f"LLM 输出格式错误: {result[:200]}")
        data = json.loads(m.group())
    if isinstance(data, dict):
        data = data.get("shots", [])
    if not isinstance(data, list) or not data:
        raise ValueError("LLM 未返回分镜数组")
    normalized: list[dict] = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            continue
        desc = str(item.get("description") or "").strip()
        if not desc:            # 描述为空的分镜等于没填充，直接判无效
            continue
        try:
            dur = int(float(item.get("duration") or 3))
        except (TypeError, ValueError):
            dur = 3
        normalized.append({
            "shot_id": item.get("shot_id") or i + 1,
            "camera": str(item.get("camera") or "中景"),
            "description": desc,
            "duration": max(1, min(15, dur)),
            "transition": str(item.get("transition") or "切换"),
            "dialogue": str(item.get("dialogue") or ""),
            "mood": str(item.get("mood") or ""),
        })
    if not normalized:
        raise ValueError("LLM 返回的分镜描述全部为空")
    return normalized


def _degrade_notice(exc: Exception) -> str:
    """把降级原因翻译成用户能看懂的提示。"""
    raw = str(exc)
    if "429" in raw or "quota" in raw.lower():
        return "大模型配额已耗尽，已使用本地规则生成分镜"
    if "未配置" in raw or "API Key" in raw:
        return "未配置大模型 API Key，已使用本地规则生成分镜"
    if "格式" in raw or "数组" in raw:
        return "大模型返回格式异常，已使用本地规则生成分镜"
    if "timeout" in raw.lower() or "timed out" in raw.lower():
        return "大模型响应超时，已使用本地规则生成分镜"
    return "大模型暂不可用，已使用本地规则生成分镜"


@router.get("/models")
async def list_models():
    """可用于分镜/润色的语言模型清单（这些模型不能生成视频）。"""
    data = llm_client.available_text_models()
    data["note"] = "语言模型仅用于 AI 润色/分镜；生成视频需 Seedance 等视频模型"
    return data


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

    result, _used = await _call_llm(system, req.prompt, model=req.llm_model)
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
    if req.tags:
        user += f"\n\n参考标签（请自然融入各镜头的 description 中，不要生硬堆砌）：{', '.join(req.tags)}"

    shots: list[dict] = []
    source = "local"
    notice = ""
    used_model = ""
    try:
        result, used_model = await _call_llm(system, user, model=req.llm_model)
        shots = _parse_shots(result)
        source = "ai"
    except Exception as exc:  # Key 缺失 / 配额耗尽 / 超时 / 输出格式错
        notice = _degrade_notice(exc)

    if not shots:
        local = build_storyboard(req.script, req.scene_count, req.style, req.tags)
        shots = local["shots"]
        source = "local"

    return {
        "script": req.script,
        "shots": shots,
        "total_shots": len(shots),
        "total_duration": sum(s.get("duration", 3) for s in shots),
        "source": source,
        "notice": notice,
        "model": used_model,
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

    result, _used = await _call_llm(system, req.prompt, model=req.llm_model)
    return {"original": req.prompt, "enhanced": result.strip()}
