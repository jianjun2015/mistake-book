"""
意图识别服务
"""
import re
from typing import Dict, Tuple

# 转人工关键词
TRANSFER_KEYWORDS = ["转人工", "人工客服", "人工服务", "找人工", "转接人工", "真人"]

# 投诉关键词
COMPLAINT_KEYWORDS = ["投诉", "举报", "不满意", "垃圾", "骗子", "骗人", "退款", "赔偿", "315", "消协", "曝光"]

# 操作关键词
OPERATION_KEYWORDS = ["退款", "退货", "换货", "修改", "取消", "删除", "解绑", "注销", "重置"]

# 问候语
GREETING_KEYWORDS = ["你好", "您好", "在吗", "hi", "hello", "哈喽", "嗨"]

# 结束语
FAREWELL_KEYWORDS = ["再见", "拜拜", "谢谢", "感谢", "bye"]


def classify_intent(message: str) -> Dict:
    """识别用户意图"""
    msg = message.lower().strip()
    
    # 转人工
    for kw in TRANSFER_KEYWORDS:
        if kw in msg:
            return {"intent": "transfer_human", "confidence": 0.95, "trigger": kw}
    
    # 投诉
    for kw in COMPLAINT_KEYWORDS:
        if kw in msg:
            return {"intent": "complaint", "confidence": 0.85, "trigger": kw}
    
    # 操作
    for kw in OPERATION_KEYWORDS:
        if kw in msg:
            return {"intent": "operation", "confidence": 0.80, "trigger": kw}
    
    # 问候
    for kw in GREETING_KEYWORDS:
        if kw in msg:
            return {"intent": "greeting", "confidence": 0.90, "trigger": kw}
    
    # 结束
    for kw in FAREWELL_KEYWORDS:
        if kw in msg:
            return {"intent": "farewell", "confidence": 0.90, "trigger": kw}
    
    # 默认为知识问答
    return {"intent": "knowledge_qa", "confidence": 0.70, "trigger": None}
