"""
会话服务
"""
import json
from typing import List, Dict, Any, Optional
from utils.database import get_db


def create_session(user_id: str, user_name: str = "", channel: str = "web") -> Dict:
    with get_db() as db:
        db.execute(
            "INSERT INTO cs_sessions (user_id, user_name, channel) VALUES (%s, %s, %s)",
            (user_id, user_name, channel)
        )
        session_id = db.lastrowid
    return get_session(session_id)


def get_session(session_id: int) -> Optional[Dict]:
    with get_db() as db:
        db.execute("SELECT * FROM cs_sessions WHERE id=%s", (session_id,))
        row = db.fetchone()
        if row and row.get("tags"):
            row["tags"] = json.loads(row["tags"])
        return row


def list_sessions(status: str = None, agent_id: str = None, page: int = 1, size: int = 20) -> Dict:
    with get_db() as db:
        where = []
        params = []
        if status:
            where.append("status=%s")
            params.append(status)
        if agent_id:
            where.append("agent_id=%s")
            params.append(agent_id)
        
        where_clause = f"WHERE {' AND '.join(where)}" if where else ""
        db.execute(f"SELECT COUNT(*) as cnt FROM cs_sessions {where_clause}", params)
        total = db.fetchone()["cnt"]
        
        db.execute(
            f"SELECT * FROM cs_sessions {where_clause} ORDER BY updated_at DESC LIMIT %s OFFSET %s",
            params + [size, (page - 1) * size]
        )
        items = db.fetchall()
        for item in items:
            if item.get("tags"):
                item["tags"] = json.loads(item["tags"])
        return {"items": items, "total": total, "page": page, "size": size}


def update_session(session_id: int, updates: Dict):
    with get_db() as db:
        sets = []
        params = []
        for k, v in updates.items():
            if k == "tags":
                v = json.dumps(v, ensure_ascii=False)
            sets.append(f"{k}=%s")
            params.append(v)
        params.append(session_id)
        db.execute(f"UPDATE cs_sessions SET {', '.join(sets)} WHERE id=%s", params)


def close_session(session_id: int):
    with get_db() as db:
        db.execute(
            "UPDATE cs_sessions SET status='closed', closed_at=NOW() WHERE id=%s",
            (session_id,)
        )
