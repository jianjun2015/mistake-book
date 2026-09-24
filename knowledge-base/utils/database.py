"""
MySQL元数据存储
"""
import pymysql
import json
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from config.settings import settings


def get_connection():
    """获取MySQL连接"""
    return pymysql.connect(
        host="localhost",
        port=3306,
        user="root",
        password="Admin@2026!Mysql",
        database="knowledge_base",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )


@contextmanager
def get_db():
    """获取数据库游标"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        yield cursor
    finally:
        conn.close()


def init_db():
    """初始化数据库"""
    # 先创建数据库
    root_conn = pymysql.connect(
        host="localhost", port=3306, user="root", password="Admin@2026!Mysql",
        charset="utf8mb4", autocommit=True
    )
    with root_conn.cursor() as cur:
        cur.execute("CREATE DATABASE IF NOT EXISTS knowledge_base DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci")
    root_conn.close()
    
    with get_db() as db:
        db.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            filename VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            file_size BIGINT DEFAULT 0,
            file_path VARCHAR(500),
            category VARCHAR(100),
            tags JSON,
            description TEXT,
            chunk_count INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending',
            user_id BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        db.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            parent_id BIGINT,
            sort_order INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        db.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            usage_count INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        db.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(64) PRIMARY KEY,
            user_id BIGINT,
            title VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        db.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            conversation_id VARCHAR(64) NOT NULL,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            citations JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation (conversation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)


def create_document(doc: Dict[str, Any]) -> int:
    with get_db() as db:
        db.execute(
            """INSERT INTO documents (title, filename, file_type, file_size, file_path,
               category, tags, description, chunk_count, status, user_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                doc["title"], doc["filename"], doc["file_type"],
                doc.get("file_size", 0), doc.get("file_path"),
                doc.get("category"), json.dumps(doc.get("tags", []), ensure_ascii=False),
                doc.get("description"), doc.get("chunk_count", 0),
                doc.get("status", "pending"), doc.get("user_id")
            )
        )
        return db.lastrowid


def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as db:
        db.execute("SELECT * FROM documents WHERE id=%s", (doc_id,))
        row = db.fetchone()
        if not row:
            return None
        row["tags"] = json.loads(row.get("tags") or "[]")
        return row


def list_documents(category: str = None, page: int = 1, size: int = 20) -> Dict[str, Any]:
    with get_db() as db:
        where = ""
        params = []
        if category:
            where = "WHERE category=%s"
            params.append(category)
        
        db.execute(f"SELECT COUNT(*) as cnt FROM documents {where}", params)
        total = db.fetchone()["cnt"]
        
        db.execute(
            f"SELECT * FROM documents {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            params + [size, (page - 1) * size]
        )
        items = db.fetchall()
        
        for d in items:
            d["tags"] = json.loads(d.get("tags") or "[]")
        
        return {"items": items, "total": total, "page": page, "size": size}


def update_document(doc_id: int, updates: Dict[str, Any]):
    with get_db() as db:
        sets = []
        params = []
        for k, v in updates.items():
            if k == "tags":
                v = json.dumps(v, ensure_ascii=False)
            sets.append(f"{k}=%s")
            params.append(v)
        params.append(doc_id)
        db.execute(f"UPDATE documents SET {', '.join(sets)}, updated_at=CURRENT_TIMESTAMP WHERE id=%s", params)


def delete_document(doc_id: int):
    with get_db() as db:
        db.execute("DELETE FROM documents WHERE id=%s", (doc_id,))


# 分类
def create_category(name: str, parent_id: int = None) -> int:
    with get_db() as db:
        db.execute("INSERT INTO categories (name, parent_id) VALUES (%s, %s)", (name, parent_id))
        return db.lastrowid


def list_categories() -> List[Dict[str, Any]]:
    with get_db() as db:
        db.execute("SELECT * FROM categories ORDER BY sort_order, id")
        return list(db.fetchall())


def delete_category(cat_id: int):
    with get_db() as db:
        db.execute("DELETE FROM categories WHERE id=%s", (cat_id,))


# 标签
def upsert_tag(name: str):
    with get_db() as db:
        db.execute(
            "INSERT INTO tags (name, usage_count) VALUES (%s, 1) "
            "ON DUPLICATE KEY UPDATE usage_count = usage_count + 1",
            (name,)
        )


def list_tags() -> List[Dict[str, Any]]:
    with get_db() as db:
        db.execute("SELECT * FROM tags ORDER BY usage_count DESC")
        return list(db.fetchall())


# 会话
def create_conversation(cid: str, user_id: int = None, title: str = ""):
    with get_db() as db:
        db.execute("INSERT INTO conversations (id, user_id, title) VALUES (%s, %s, %s)", (cid, user_id, title))


def add_message(conversation_id: str, role: str, content: str, citations: List = None):
    with get_db() as db:
        db.execute(
            "INSERT INTO messages (conversation_id, role, content, citations) VALUES (%s, %s, %s, %s)",
            (conversation_id, role, content, json.dumps(citations or [], ensure_ascii=False))
        )


def get_conversation_messages(cid: str) -> List[Dict[str, Any]]:
    with get_db() as db:
        db.execute("SELECT * FROM messages WHERE conversation_id=%s ORDER BY created_at", (cid,))
        rows = db.fetchall()
        result = []
        for r in rows:
            r["citations"] = json.loads(r.get("citations") or "[]")
            result.append(r)
        return result


def list_conversations(user_id: int = None) -> List[Dict[str, Any]]:
    with get_db() as db:
        if user_id:
            db.execute("SELECT * FROM conversations WHERE user_id=%s ORDER BY created_at DESC", (user_id,))
        else:
            db.execute("SELECT * FROM conversations ORDER BY created_at DESC")
        return list(db.fetchall())
