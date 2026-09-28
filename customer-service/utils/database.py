"""
MySQL数据库工具
"""
import pymysql
import json
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB


def get_connection():
    return pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER,
        password=MYSQL_PASSWORD, database=MYSQL_DB,
        charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )


@contextmanager
def get_db():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        yield cursor
    finally:
        conn.close()


def init_db():
    """初始化数据库和表"""
    root_conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER,
        password=MYSQL_PASSWORD, charset="utf8mb4", autocommit=True
    )
    with root_conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB} DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci")
    root_conn.close()

    with get_db() as db:
        db.execute("""
        CREATE TABLE IF NOT EXISTS cs_sessions (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(64) NOT NULL,
            user_name VARCHAR(100),
            status ENUM('active','waiting_human','human_handling','closed') DEFAULT 'active',
            channel VARCHAR(20) DEFAULT 'web',
            agent_id VARCHAR(64),
            agent_name VARCHAR(100),
            summary TEXT,
            tags JSON,
            satisfaction INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            closed_at TIMESTAMP NULL,
            INDEX idx_status (status),
            INDEX idx_user (user_id),
            INDEX idx_agent (agent_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        db.execute("""
        CREATE TABLE IF NOT EXISTS cs_messages (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            session_id BIGINT NOT NULL,
            role ENUM('user','ai','agent','system') NOT NULL,
            content TEXT NOT NULL,
            msg_type VARCHAR(20) DEFAULT 'text',
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        db.execute("""
        CREATE TABLE IF NOT EXISTS cs_tickets (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            session_id BIGINT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
            status ENUM('pending','processing','resolved','closed') DEFAULT 'pending',
            assignee_id VARCHAR(64),
            resolution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_assignee (assignee_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        db.execute("""
        CREATE TABLE IF NOT EXISTS cs_faq (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            question VARCHAR(500) NOT NULL,
            answer TEXT NOT NULL,
            category VARCHAR(100),
            usage_count INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        db.execute("""
        CREATE TABLE IF NOT EXISTS cs_agents (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            role ENUM('admin','agent','viewer') DEFAULT 'agent',
            status ENUM('online','busy','offline') DEFAULT 'offline',
            max_sessions INT DEFAULT 10,
            current_sessions INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
