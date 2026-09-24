"""
SQLite轻量级元数据存储
"""
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from contextlib import contextmanager
from config.settings import settings


DB_PATH = "./data/knowledge_base.db"


@contextmanager
def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    """初始化数据库"""
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            file_path TEXT,
            category TEXT,
            tags TEXT DEFAULT '[]',
            description TEXT,
            chunk_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id INTEGER,
            sort_order INTEGER DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            usage_count INTEGER DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            citations TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)


def create_document(doc: Dict[str, Any]) -> int:
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO documents (title, filename, file_type, file_size, file_path,
               category, tags, description, chunk_count, status, user_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                doc["title"], doc["filename"], doc["file_type"],
                doc.get("file_size", 0), doc.get("file_path"),
                doc.get("category"), json.dumps(doc.get("tags", []), ensure_ascii=False),
                doc.get("description"), doc.get("chunk_count", 0),
                doc.get("status", "pending"), doc.get("user_id")
            )
        )
        return cursor.lastrowid


def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
        if not row:
            return None
        d = dict(row)
        d["tags"] = json.loads(d.get("tags") or "[]")
        return d


def list_documents(category: str = None, page: int = 1, size: int = 20) -> Dict[str, Any]:
    with get_db() as db:
        where = ""
        params = []
        if category:
            where = "WHERE category=?"
            params.append(category)
        
        total = db.execute(f"SELECT COUNT(*) FROM documents {where}", params).fetchone()[0]
        rows = db.execute(
            f"SELECT * FROM documents {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [size, (page - 1) * size]
        ).fetchall()
        
        items = []
        for r in rows:
            d = dict(r)
            d["tags"] = json.loads(d.get("tags") or "[]")
            items.append(d)
        
        return {"items": items, "total": total, "page": page, "size": size}


def update_document(doc_id: int, updates: Dict[str, Any]):
    with get_db() as db:
        sets = []
        params = []
        for k, v in updates.items():
            if k == "tags":
                v = json.dumps(v, ensure_ascii=False)
            sets.append(f"{k}=?")
            params.append(v)
        params.append(doc_id)
        db.execute(f"UPDATE documents SET {', '.join(sets)}, updated_at=CURRENT_TIMESTAMP WHERE id=?", params)


def delete_document(doc_id: int):
    with get_db() as db:
        db.execute("DELETE FROM documents WHERE id=?", (doc_id,))


# 分类
def create_category(name: str, parent_id: int = None) -> int:
    with get_db() as db:
        cur = db.execute("INSERT INTO categories (name, parent_id) VALUES (?, ?)", (name, parent_id))
        return cur.lastrowid


def list_categories() -> List[Dict[str, Any]]:
    with get_db() as db:
        rows = db.execute("SELECT * FROM categories ORDER BY sort_order, id").fetchall()
        return [dict(r) for r in rows]


def delete_category(cat_id: int):
    with get_db() as db:
        db.execute("DELETE FROM categories WHERE id=?", (cat_id,))


# 标签
def upsert_tag(name: str):
    with get_db() as db:
        db.execute(
            "INSERT INTO tags (name, usage_count) VALUES (?, 1) "
            "ON CONFLICT(name) DO UPDATE SET usage_count = usage_count + 1",
            (name,)
        )


def list_tags() -> List[Dict[str, Any]]:
    with get_db() as db:
        rows = db.execute("SELECT * FROM tags ORDER BY usage_count DESC").fetchall()
        return [dict(r) for r in rows]


# 会话
def create_conversation(cid: str, user_id: int = None, title: str = ""):
    with get_db() as db:
        db.execute("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)", (cid, user_id, title))


def add_message(conversation_id: str, role: str, content: str, citations: List = None):
    with get_db() as db:
        db.execute(
            "INSERT INTO messages (conversation_id, role, content, citations) VALUES (?, ?, ?, ?)",
            (conversation_id, role, content, json.dumps(citations or [], ensure_ascii=False))
        )


def get_conversation_messages(cid: str) -> List[Dict[str, Any]]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at", (cid,)
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["citations"] = json.loads(d.get("citations") or "[]")
            result.append(d)
        return result


def list_conversations(user_id: int = None) -> List[Dict[str, Any]]:
    with get_db() as db:
        if user_id:
            rows = db.execute("SELECT * FROM conversations WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
        else:
            rows = db.execute("SELECT * FROM conversations ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]
