"""本地规则分镜生成器 —— 无外部依赖的确定性兜底。

用途：当大模型不可用（未配 Key / 配额耗尽 / 超时）时，仍能把剧本拆成
可直接用的分镜脚本，保证「分镜填充」永远有结果。
"""
import re

# 镜头类型按叙事节奏排列：由远及近再收尾
CAMERA_CYCLE = ["远景", "全景", "中景", "近景", "特写", "中景", "远景"]

# 氛围关键词 → 情绪
MOOD_KEYWORDS = [
    (("悲伤", "哭", "泪", "离别", "失去", "孤独", "寂寞"), "悲伤"),
    (("紧张", "危险", "追", "逃", "冲突", "战斗", "惊"), "紧张"),
    (("温暖", "拥抱", "家", "母亲", "爱", "陪伴", "善良"), "温暖"),
    (("宁静", "安静", "清晨", "夜", "月", "湖", "森林"), "宁静"),
    (("壮观", "宏伟", "山海", "日落", "霞", "星空", "城市"), "壮观"),
    (("欢快", "笑", "奔跑", "玩", "节日", "庆祝"), "欢快"),
]

# 描述增强词：让描述更接近可直接出片的提示词
LIGHT_WORDS = ["柔和光线", "自然光", "逆光轮廓", "暖色光影", "清冷色调", "晨昏光"]


def _split_clauses(script: str) -> list[str]:
    """把剧本切成有意义的画面单元。"""
    script = script.replace("\r", "")
    # 先按换行与句末标点切
    raw = re.split(r"[。！？!?\n]+", script)
    clauses: list[str] = []
    for seg in raw:
        seg = seg.strip()
        if not seg:
            continue
        # 过长的句子再按逗号切
        if len(seg) > 28:
            sub = [p.strip() for p in re.split(r"[，,；;、]+", seg) if p.strip()]
            clauses.extend(sub if sub else [seg])
        else:
            clauses.append(seg)
    # 过短的碎片合并到前一段
    merged: list[str] = []
    for c in clauses:
        if merged and len(c) <= 4:
            merged[-1] = merged[-1] + "，" + c
        else:
            merged.append(c)
    return merged or ([script.strip()] if script.strip() else [])


def _mood_of(text: str) -> str:
    for words, mood in MOOD_KEYWORDS:
        if any(w in text for w in words):
            return mood
    return "叙事"


def _balance(clauses: list[str], scene_count: int) -> list[str]:
    """把若干分句均衡地摊到目标镜头数上。"""
    n = len(clauses)
    if scene_count <= 0:
        scene_count = 5
    if n == 0:
        return []
    if n <= scene_count:
        # 不足则一镜一句，镜头数取实际句子数（不硬凑空白镜头）
        return clauses
    # 超出则按比例合并成 scene_count 组
    out: list[str] = []
    for i in range(scene_count):
        start = round(i * n / scene_count)
        end = round((i + 1) * n / scene_count)
        chunk = clauses[start:end] or [clauses[min(start, n - 1)]]
        out.append("，".join(chunk))
    return out


def build_storyboard(script: str, scene_count: int = 5, style: str = "",
                     tags: list[str] | None = None) -> dict:
    """生成分镜列表。返回结构与 /ai/storyboard 接口完全一致。"""
    tags = tags or []
    groups = _balance(_split_clauses(script), scene_count)
    total = len(groups)
    shots: list[dict] = []

    for i, text in enumerate(groups):
        camera = CAMERA_CYCLE[i % len(CAMERA_CYCLE)]
        if i == 0:
            camera = "远景"          # 开场建立环境
        elif i == total - 1 and total > 2:
            camera = "远景"          # 结尾收束

        if i == 0:
            transition = "淡入"
        elif i == total - 1:
            transition = "淡出"
        else:
            transition = "切换"

        # 时长：开头/结尾稍长，中间紧凑
        duration = 4 if i in (0, total - 1) else 3

        desc_parts = [text]
        if style:
            desc_parts.append(style)
        desc_parts.append(LIGHT_WORDS[i % len(LIGHT_WORDS)])
        # 已选标签自然融入（最多 3 个，避免堆砌）
        if tags:
            desc_parts.extend(tags[:3])
        desc_parts.append(f"{camera}镜头")

        shots.append({
            "shot_id": i + 1,
            "camera": camera,
            "description": "，".join(p for p in desc_parts if p),
            "duration": duration,
            "transition": transition,
            "dialogue": "",
            "mood": _mood_of(text),
        })

    return {
        "script": script,
        "shots": shots,
        "total_shots": len(shots),
        "total_duration": sum(s["duration"] for s in shots),
    }
