"""
目录管理 + 会话星标服务 (MySQL/pymysql)
"""
import logging
from typing import List, Dict, Optional
from utils.database import get_connection

logger = logging.getLogger(__name__)


def init_directory_table():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS directories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            parent_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    try:
        cur.execute("ALTER TABLE cs_sessions ADD COLUMN directory_id INT DEFAULT NULL")
    except: pass
    try:
        cur.execute("ALTER TABLE cs_sessions ADD COLUMN starred TINYINT(1) DEFAULT 0")
    except: pass
    cur.close()
    conn.close()


def create_directory(name: str, parent_id: Optional[int] = None) -> Dict:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO directories (name, parent_id) VALUES (%s, %s)", (name, parent_id))
    dir_id = cur.lastrowid
    cur.close()
    conn.close()
    return {"id": dir_id, "name": name, "parent_id": parent_id}


def list_directories() -> List[Dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM directories ORDER BY parent_id, name")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def rename_directory(dir_id: int, name: str) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE directories SET name = %s WHERE id = %s", (name, dir_id))
    cur.close()
    conn.close()
    return True


def delete_directory(dir_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE cs_sessions SET directory_id = NULL WHERE directory_id = %s", (dir_id,))
    cur.execute("UPDATE directories SET parent_id = NULL WHERE parent_id = %s", (dir_id,))
    cur.execute("DELETE FROM directories WHERE id = %s", (dir_id,))
    cur.close()
    conn.close()
    return True


def move_session(session_id: int, directory_id: Optional[int]) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE cs_sessions SET directory_id = %s WHERE id = %s", (directory_id, session_id))
    cur.close()
    conn.close()
    return True


def toggle_star(session_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE cs_sessions SET starred = 1 - COALESCE(starred, 0) WHERE id = %s", (session_id,))
    cur.execute("SELECT starred FROM cs_sessions WHERE id = %s", (session_id,))
    val = cur.fetchone()["starred"]
    cur.close()
    conn.close()
    return bool(val)


def delete_session(session_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM cs_messages WHERE session_id = %s", (session_id,))
    cur.execute("DELETE FROM cs_sessions WHERE id = %s", (session_id,))
    cur.close()
    conn.close()
    return True
