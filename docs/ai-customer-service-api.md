# 智能客服 API 接入文档

> **版本**: v1.0 | **日期**: 2026-09-28
> **服务地址**: `https://ty66666.cloud/cs-api`

---

## 1. 概述

智能客服系统基于大模型 + 知识库，提供AI自动问答、人工转接、工单管理等能力。支持Web页面接入和API接口接入两种方式。

### 1.1 核心能力

| 能力 | 说明 | 响应时间 |
|------|------|----------|
| AI智能问答 | 基于知识库RAG检索 + LLM生成回答 | 5-7秒 |
| FAQ快速问答 | 常见问题秒回 | <100ms |
| 意图识别 | 自动识别转人工/投诉/操作等意图 | <100ms |
| 语义缓存 | 相似问题命中缓存 | <100ms |
| 人工转接 | AI无法解决时无缝转人工 | 实时 |
| 满意度评价 | 会话结束后评分 | — |

### 1.2 接入方式

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| **Web页面** | 直接访问 | https://ty66666.cloud/customer-service |
| **API接口** | 三方系统集成 | REST API，本文档重点 |
| **嵌入组件** | 自有前端集成 | React组件，开源可复用 |

---

## 2. 快速开始

### 2.1 Base URL

```
https://ty66666.cloud/cs-api
```

### 2.2 三步接入

```bash
# 第1步：创建会话
curl -X POST https://ty66666.cloud/cs-api/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_001", "user_name": "张三"}'

# 返回: {"id": 1, "status": "active", ...}

# 第2步：发送消息（AI自动回复）
curl -X POST https://ty66666.cloud/cs-api/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "你好，请问有什么服务？"}'

# 返回: {"ai_reply": {"content": "您好！我是智能客服助手..."}, ...}

# 第3步：获取消息历史
curl https://ty66666.cloud/cs-api/sessions/1/messages
```

---

## 3. API 详细说明

### 3.1 创建会话

```
POST /sessions
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | ✅ | 用户唯一标识 |
| user_name | string | ❌ | 用户昵称 |
| channel | string | ❌ | 渠道来源（web/app/mini等），默认web |

**请求示例：**
```json
{
  "user_id": "user_001",
  "user_name": "张三",
  "channel": "web"
}
```

**响应示例：**
```json
{
  "id": 1,
  "user_id": "user_001",
  "user_name": "张三",
  "status": "active",
  "channel": "web",
  "created_at": "2026-09-28T16:00:00"
}
```

---

### 3.2 发送消息（核心接口）

```
POST /sessions/{session_id}/messages
```

AI根据消息内容自动回复。如果识别到转人工/投诉意图，`action` 字段会返回 `transfer_human`。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | ✅ | 消息内容 |
| msg_type | string | ❌ | 消息类型（text/image/file），默认text |

**响应示例（AI自动回复）：**
```json
{
  "user_message": {
    "id": 10,
    "role": "user",
    "content": "什么是光合作用？"
  },
  "ai_reply": {
    "id": 11,
    "role": "ai",
    "content": "光合作用是植物利用光能将二氧化碳和水转化为有机物的过程..."
  },
  "action": "reply",
  "citations": [
    {"filename": "生物知识.md", "score": 0.85},
    {"filename": "化学基础.txt", "score": 0.72}
  ]
}
```

**响应示例（触发转人工）：**
```json
{
  "user_message": {"id": 12, "role": "user", "content": "我要投诉"},
  "ai_reply": {
    "id": 13,
    "role": "ai",
    "content": "非常抱歉给您带来了不好的体验。正在为您转接人工客服处理..."
  },
  "action": "transfer_human",
  "citations": []
}
```

**action 字段说明：**

| 值 | 含义 | 前端建议处理 |
|------|------|------------|
| `reply` | AI正常回复 | 显示AI回答 |
| `transfer_human` | 需要转人工 | 切换人工状态，等待客服接入 |

**source 字段说明（answer来源）：**

| 值 | 含义 | 响应时间 |
|------|------|----------|
| `instant` | 意图路由直接回复 | ~0ms |
| `faq` | FAQ缓存命中 | ~5ms |
| `cache` | 语义缓存命中 | ~1ms |
| `llm` | LLM生成 | 5-7秒 |

---

### 3.3 转人工

```
POST /sessions/{session_id}/transfer
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | ❌ | 转人工原因，默认 user_request |

**响应示例：**
```json
{"status": "waiting_human"}
```

---

### 3.4 获取消息历史

```
GET /sessions/{session_id}/messages?limit=50&offset=0
```

**响应示例：**
```json
[
  {
    "id": 1,
    "session_id": 1,
    "role": "ai",
    "content": "您好！我是智能客服助手，请问有什么可以帮您？",
    "msg_type": "text",
    "created_at": "2026-09-28T16:00:00"
  },
  {
    "id": 2,
    "session_id": 1,
    "role": "user",
    "content": "你好",
    "msg_type": "text",
    "created_at": "2026-09-28T16:00:05"
  }
]
```

---

### 3.5 满意度评价

```
POST /sessions/{session_id}/satisfaction
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| score | int | ✅ | 评分 1-5 星 |
| comment | string | ❌ | 评价备注 |

---

### 3.6 关闭会话

```
POST /agent/sessions/{session_id}/close
```

---

### 3.7 数据统计（管理端）

```
GET /stats
```

**响应示例：**
```json
{
  "total_sessions": 128,
  "active_sessions": 5,
  "avg_satisfaction": 4.6,
  "ai_messages": 356,
  "total_tickets": 12
}
```

---

## 4. 客服工作台 API

### 4.1 获取待处理会话

```
GET /agent/sessions?status=waiting_human&page=1&size=20
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 筛选状态：active/waiting_human/human_handling/closed |
| page | int | 页码，默认1 |
| size | int | 每页条数，默认20 |

### 4.2 客服回复

```
POST /agent/sessions/{session_id}/reply
```

**请求：**
```json
{"content": "您好，我是客服小王，有什么可以帮您？"}
```

### 4.3 会话转接

```
POST /agent/sessions/{session_id}/transfer
```

**请求：**
```json
{"agent_id": "agent_002", "agent_name": "小李"}
```

---

## 5. 业务规则

### 5.1 自动转人工触发条件

| 条件 | 说明 |
|------|------|
| 用户主动请求 | 消息含"转人工"、"人工客服"等 |
| 投诉意图 | 消息含"投诉"、"举报"、"退款"等 |
| AI无法回答 | 知识库中无相关内容 |
| 操作类请求 | 退款、退货、修改账户等需人工处理 |

### 5.2 会话状态流转

```
active ──(转人工)──→ waiting_human ──(客服接入)──→ human_handling ──(关闭)──→ closed
  │                                                                        ↑
  └────────────────────────(30分钟无消息自动关闭)────────────────────────────┘
```

| 状态 | 含义 |
|------|------|
| `active` | AI自动对话中 |
| `waiting_human` | 等待人工客服接入 |
| `human_handling` | 人工客服处理中 |
| `closed` | 会话已关闭 |

---

## 6. 完整接入示例

### 6.1 JavaScript / TypeScript

```typescript
const BASE_URL = 'https://ty66666.cloud/cs-api';

// 创建会话
async function createSession(userId: string, userName: string) {
  const resp = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, user_name: userName })
  });
  return resp.json();
}

// 发送消息
async function sendMessage(sessionId: number, content: string) {
  const resp = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  return resp.json();
}

// 使用示例
async function main() {
  const session = await createSession('user_001', '张三');
  const result = await sendMessage(session.id, '你好');
  
  console.log('AI回答:', result.ai_reply.content);
  console.log('引用来源:', result.citations);
  
  if (result.action === 'transfer_human') {
    console.log('已转人工，等待客服...');
  }
}
```

### 6.2 Python

```python
import requests

BASE_URL = "https://ty66666.cloud/cs-api"

# 创建会话
session = requests.post(f"{BASE_URL}/sessions", json={
    "user_id": "user_001",
    "user_name": "张三"
}).json()

# 发送消息
result = requests.post(f"{BASE_URL}/sessions/{session['id']}/messages", json={
    "content": "什么是光合作用？"
}).json()

print(f"AI回答: {result['ai_reply']['content']}")
print(f"引用来源: {[c['filename'] for c in result.get('citations', [])]}")

# 判断是否需要转人工
if result.get("action") == "transfer_human":
    print("已转人工")
```

### 6.3 Java

```java
// 创建会话
Map<String, String> sessionReq = Map.of("user_id", "user_001", "user_name", "张三");
ResponseEntity<Map> sessionResp = restTemplate.postForEntity(
    BASE_URL + "/sessions", sessionReq, Map.class);
Integer sessionId = (Integer) sessionResp.getBody().get("id");

// 发送消息
Map<String, String> msgReq = Map.of("content", "你好");
ResponseEntity<Map> msgResp = restTemplate.postForEntity(
    BASE_URL + "/sessions/" + sessionId + "/messages", msgReq, Map.class);

Map aiReply = (Map) msgResp.getBody().get("ai_reply");
System.out.println("AI回答: " + aiReply.get("content"));
```

---

## 7. 嵌入前端组件（React）

已提供开箱即用的 React 组件，可直接嵌入任意 React 项目：

```tsx
import CustomerServiceWidget from './components/CustomerServiceWidget';

// 使用组件
<CustomerServiceWidget 
  userId="user_001" 
  userName="张三"
  apiUrl="https://ty66666.cloud/cs-api"
/>
```

**组件位置：**
```
customer-service/frontend/CustomerServiceWidget.tsx  # 用户端对话窗口
customer-service/frontend/AgentWorkbench.tsx          # 客服工作台
```

**组件功能：**
- 聊天气泡界面
- AI自动回复 + 引用标注
- 转人工按钮
- 满意度评价弹窗
- 等待动画提示

---

## 8. 响应时间参考

| 场景 | 响应时间 | 说明 |
|------|----------|------|
| 创建会话 | ~50ms | — |
| 意图路由（问候/转人工） | <100ms | 不走LLM |
| FAQ缓存命中 | <100ms | 常见问题 |
| 语义缓存命中 | <100ms | 相似问题 |
| LLM知识问答 | 5-7秒 | 首次全新问题 |
| 获取消息历史 | ~50ms | — |

**加速建议：**
- 高频问题预置到FAQ缓存
- 相似问题自动复用历史回答
- 转人工/问候类消息秒回

---

## 9. 错误码

| HTTP状态码 | 含义 | 处理建议 |
|-----------|------|----------|
| 200 | 成功 | — |
| 400 | 参数错误 | 检查请求参数 |
| 404 | 会话不存在 | 重新创建会话 |
| 500 | 服务器错误 | 稍后重试或转人工 |

**错误响应示例：**
```json
{"detail": "会话不存在"}
```

---

## 10. 会话管理建议

| 建议 | 说明 |
|------|------|
| 会话复用 | 同一用户的多轮对话使用同一session_id |
| 超时处理 | 30分钟无消息自动关闭，建议前端定时检查 |
| 状态监听 | 根据 `action` 字段切换UI状态 |
| 历史加载 | 页面刷新后调用 `GET /messages` 恢复对话 |
| 满意度引导 | 会话结束后引导用户评价 |

---

## 11. 联系方式

| 项目 | 信息 |
|------|------|
| 服务地址 | https://ty66666.cloud/customer-service |
| API Base | https://ty66666.cloud/cs-api |
| API文档 | 服务启动后访问 `/docs` (Swagger UI) |
| 源码仓库 | https://github.com/jianjun2015/mistake-book |
