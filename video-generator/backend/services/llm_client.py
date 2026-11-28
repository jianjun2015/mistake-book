"""多通道 LLM 客户端。

优先级：
1. 火山方舟 Coding 套餐（ARK_API_KEY）—— 实测可用的文本模型
2. 小米 MiMo（XIAOMI_API_KEY / MIMO_API_KEY）
3. 本地规则（由调用方兜底）

注意：方舟 Coding 套餐**只含语言模型**，调用 Seedance 视频模型会返回
UnsupportedModel("does not support the coding plan feature")。
视频生成必须走 /api/v3 并单独开通 Seedance 模型。
"""
import os

import httpx

# 火山方舟 Coding 套餐语言模型（全小写规范，与开通管理页可复制名称一致）
# 2026-11 实测全部 200；方舟同时兼容首字母大写写法，但统一小写最稳
ARK_TEXT_MODELS = [
    "doubao-seed-2.1-pro", "doubao-seed-evolving", "doubao-seed-2.1-lite",
    "doubao-seed-2.0-mini",
    "deepseek-v4.1-flash", "deepseek-v4.1-flash-economy", "deepseek-v4-flash",
    "deepseek-v4-pro",
    "glm-5.4", "glm-5.3", "glm-5.3-flash",  # glm-latest 是 glm-5.3 的别名
    "kimi-k3.1-pro", "kimi-k2.8-preview",
]

# 预览版模型：可用但接口/定价可能调整
ARK_PREVIEW = {"kimi-k2.8-preview"}

# 模型别名 → 规范名
ARK_ALIASES = {
    "glm-latest": "glm-5.3",
}

DEFAULT_ARK_MODEL = os.environ.get("ARK_MODEL", "doubao-seed-2.1-pro").lower()
DEFAULT_MIMO_MODEL = "mimo-v2.6-pro"


class LLMUnavailable(RuntimeError):
    """所有通道都不可用。"""


def _ark_key() -> str:
    for name in ("ARK_API_KEY", "VOLC_API_KEY", "ARK_CODING_API_KEY"):
        v = os.environ.get(name, "").strip()
        if v:
            return v
    # 兼容项目内配置文件
    try:
        import pathlib
        p = pathlib.Path(__file__).resolve().parents[2] / "config" / "ark_key.txt"
        if p.exists():
            return p.read_text().strip()
    except Exception:
        pass
    return ""


def _ark_base() -> str:
    return os.environ.get("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/coding/v3").rstrip("/")


def _mimo_key() -> str:
    for name in ("XIAOMI_API_KEY", "MIMO_API_KEY"):
        v = os.environ.get(name, "").strip()
        if v:
            return v
    return ""


def _mimo_base() -> str:
    return os.environ.get("XIAOMI_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1").rstrip("/")


def _normalize_model(model: str) -> str:
    """把用户传入的模型名归一化到套餐规范 ID（小写 + 别名解析）。"""
    m = (model or "").strip().lower()
    if m in ARK_ALIASES:
        return ARK_ALIASES[m]
    if m in ARK_TEXT_MODELS:
        return m
    # 大小写不敏感匹配（兼容旧配置里的 Doubao-Seed-... 写法）
    for canon in ARK_TEXT_MODELS:
        if canon.lower() == m:
            return canon
    return m


def channels() -> list[dict]:
    """当前可用的文本通道（不含无 Key 的）。"""
    out: list[dict] = []
    if _ark_key():
        out.append({
            "channel": "ark", "label": "火山方舟 Coding 套餐",
            "base_url": _ark_base(), "api_key": _ark_key(),
            "model": DEFAULT_ARK_MODEL, "models": list(ARK_TEXT_MODELS),
        })
    if _mimo_key():
        out.append({
            "channel": "mimo", "label": "小米 MiMo",
            "base_url": _mimo_base(), "api_key": _mimo_key(),
            "model": DEFAULT_MIMO_MODEL, "models": [DEFAULT_MIMO_MODEL],
        })
    return out


def available_text_models() -> dict:
    """给前端用的文本模型清单（这些模型不能生成视频）。"""
    result = []
    for ch in channels():
        for m in ch["models"]:
            result.append({
                "id": m,
                "label": m + (" (preview)" if m in ARK_PREVIEW else ""),
                "channel": ch["channel"],
                "channel_label": ch["label"],
                "preview": m in ARK_PREVIEW,
                "default": m == ch["model"],
            })
    return {"channels": [{"channel": c["channel"], "label": c["label"]} for c in channels()],
            "models": result}


async def chat(system: str, user: str, model: str = "", temperature: float = 0.7,
               max_tokens: int = 2000) -> tuple[str, str]:
    """依次尝试各通道，返回 (内容, 实际使用的模型)。全失败抛 LLMUnavailable。"""
    errors: list[str] = []
    for ch in channels():
        target = _normalize_model(model) if model else ch["model"]
        if target not in ch["models"]:
            target = ch["model"]
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                resp = await client.post(
                    f"{ch['base_url']}/chat/completions",
                    headers={"Authorization": f"Bearer {ch['api_key']}",
                             "Content-Type": "application/json"},
                    json={
                        "model": target,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )
            if resp.status_code != 200:
                body = resp.text.replace("\n", " ")[:160]
                errors.append(f"{ch['channel']}({target}): {resp.status_code} {body}")
                continue
            data = resp.json()
            msg = data["choices"][0].get("message", {})
            content = (msg.get("content") or "").strip()
            if not content:
                errors.append(f"{ch['channel']}({target}): 返回内容为空")
                continue
            return content, target
        except Exception as exc:  # 网络/超时/解析
            errors.append(f"{ch['channel']}({target}): {exc}")
            continue

    if not errors:
        raise LLMUnavailable("未配置任何大模型 API Key")
    raise LLMUnavailable("；".join(errors))
