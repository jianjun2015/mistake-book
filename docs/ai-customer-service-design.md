# 智能客服智能体 — 技术设计文档

> **版本**: v1.0 | **日期**: 2026-09-28

## 1. 系统架构

```
┌─────────────────────────────────────────────────┐
│                    前端 (React)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 用户对话窗│ │ 客服工作台│ │ 管理后台(知识库) │ │
│  └────┬─────┘ └────┬─────┘ └───────┬──────────┘ │
└───────┼─────────────┼───────────────┼────────────┘
        │             │               │
   WebSocket/HTTP    WebSocket       HTTP
        │             │               │
┌───────┴─────────────┴───────────────┴────────────┐
│              API Gateway (Nginx)                   │
│         /cs-api/ → :8002  /kb-api/ → :8001        │
└───────────────────────┬───────────────────────────┘
                        │
┌───────────────────────┴───────────────────────────┐
│              智能客服后端 (FastAPI :8002)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 对话引擎  │ │ 工单系统  │ │ WebSocket服务    │  │
│  │ (RAG+意图)│ │ (工单CRUD)│ │ (实时消息推送)   │  │
│  └────┬─────┘ └────┬─────┘ └───────┬──────────┘  │
└───────┼─────────────┼───────────────┼─────────────┘
        │             │               │
   ┌────┴────┐   ┌────┴────┐   ┌─────┴─────┐
   │ 知识库   │   │  MySQL  │   │  MiMo LLM │
   │ :8001   │   │         │   │  (API)    │
   │(ChromaDB)│   │(会话/工单)│  │           │
   └─────────┘   └─────────┘   └───────────┘
```

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | React 18 + AntD 5 + WebSocket | 用户端+客服端 |
| 后端 | FastAPI + WebSocket | Python 3.11 |
| AI引擎 | MiMo mimo-v2.6-pro | OpenAI兼容API |
| 知识库 | 复用已有知识库(:8001) | ChromaDB + text2vec |
| 数据库 | MySQL 8 | 会话/消息/工单/用户 |
| 实时通信 | WebSocket + 轮询降级 | FastAPI WebSocket |
| 部署 | Nginx + systemd | 腾讯云Ubuntu |

## 3. 数据库设计

```sql
-- 客服会话表
CREATE TABLE cs_sessions (
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
);

-- 消息表
CREATE TABLE cs_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    role ENUM('user','ai','agent','system') NOT NULL,
    content TEXT NOT NULL,
    msg_type VARCHAR(20) DEFAULT 'text',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    FOREIGN KEY (session_id) REFERENCES cs_sessions(id)
);

-- 工单表
CREATE TABLE cs_tickets (
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
);

-- FAQ表
CREATE TABLE cs_faq (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    usage_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);

-- 客服人员表
CREATE TABLE cs_agents (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin','agent','viewer') DEFAULT 'agent',
    status ENUM('online','busy','offline') DEFAULT 'offline',
    max_sessions INT DEFAULT 10,
    current_sessions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. API设计

### 4.1 用户端

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/cs/sessions | 创建会话 |
| GET | /api/cs/sessions/{id}/messages | 获取消息历史 |
| POST | /api/cs/sessions/{id}/messages | 发送消息（AI自动回复） |
| POST | /api/cs/sessions/{id}/transfer | 转人工 |
| POST | /api/cs/sessions/{id}/satisfaction | 满意度评价 |
| WS | /ws/cs/sessions/{id} | WebSocket实时消息 |

### 4.2 客服工作台

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/cs/agent/sessions | 获取会话列表 |
| POST | /api/cs/agent/sessions/{id}/reply | 客服回复 |
| POST | /api/cs/agent/sessions/{id}/transfer | 转接会话 |
| POST | /api/cs/agent/sessions/{id}/close | 关闭会话 |
| GET | /api/cs/agent/quick-replies | 快捷回复列表 |
| WS | /ws/cs/agent | 客服WebSocket |

### 4.3 管理端

| 方法 | 路径 | 功能 |
|------|------|------|
| GET/POST | /api/cs/tickets | 工单列表/创建 |
| PUT | /api/cs/tickets/{id} | 更新工单 |
| GET/POST | /api/cs/faq | FAQ管理 |
| GET | /api/cs/stats | 数据统计 |
| GET | /api/cs/stats/realtime | 实时看板 |

## 5. AI对话引擎

### 5.1 对话流程

```
用户消息 → 意图识别 → 路由决策
                        ├─ 知识问答 → RAG检索 → LLM生成回答 → 返回
                        ├─ 转人工   → 通知客服 → 切换人工模式
                        ├─ 投诉     → 创建工单 → 转人工
                        └─ 闲聊     → LLM直接回答
```

### 5.2 意图分类

| 意图 | 触发条件 | 处理方式 |
|------|----------|----------|
| knowledge_qa | 一般咨询问题 | RAG检索回答 |
| transfer_human | "转人工"/"人工客服" | 切换人工 |
| complaint | 投诉/不满/情绪激动 | 创建工单+转人工 |
| operation | 需要操作（退款等） | 创建工单+转人工 |
| greeting | 你好/在吗 | 欢迎语 |
| farewell | 再见/谢谢 | 结束语 |
| unknown | 无法识别 | 兜底+引导 |

### 5.3 转人工规则

- 用户主动点击"转人工"
- 意图 = complaint / operation
- AI连续2次回答"不确定"
- 用户消息含情绪关键词（"投诉"、"不满意"、"垃圾"）

## 6. WebSocket消息协议

```json
// 发送消息
{"type": "message", "content": "用户消息", "msg_type": "text"}

// 接收AI回复
{"type": "ai_reply", "content": "AI回答", "citations": [...], "suggestions": [...]}

// 转人工
{"type": "transfer", "reason": "user_request"}

// 人工回复
{"type": "agent_reply", "content": "客服回复", "agent_name": "小王"}

// 状态变更
{"type": "status_change", "status": "human_handling"}
```
