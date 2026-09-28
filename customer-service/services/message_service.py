"""
消息服务
"""
import json
from typing import List, Dict, Any
from utils.database import get_db


def add_message(session_id: int, role: str, content: str, 
                msg_type: str = "text", metadata: Dict = None) -> Dict:
    with get_db() as db:
        db.execute(
            "INSERT INTO cs_messages (session_id, role, content, msg_type, metadata) VALUES (%s, %s, %s, %s, %s)",
            (session_id, role, content, msg_type, json.dumps(metadata or {}, ensure_ascii=False))
        )
        msg_id = db.lastrowid
    
    return {
        "id": msg_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "msg_type": msg_type,
        "metadata": metadata
    }


def get_messages(session_id: int, limit: int = 50, offset: int = 0) -> List[Dict]:
    with get_db() as db:
        db.execute(
            "SELECT * FROM cs_messages WHERE session_id=%s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (session_id, limit, offset)
        )
        rows = db.fetchall()
        result = []
        for r in rows:
            if r.get("metadata"):
                r["metadata"] = json.loads(r["metadata"])
            result.append(r)
        return list(reversed(result))
