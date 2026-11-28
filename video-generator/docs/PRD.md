# 文生视频平台 — PRD & 技术方案

> 版本: v2.0 | 日期: 2026-11-28 | 状态: 已上线（架构与版本链详见 ARCHITECTURE.md）

---

## 一、产品定位

**一句话**：输入文字描述，一键生成视频，支持多厂商 API 切换配置。

### 核心场景
1. 用户输入文字描述（如"一只猫在草地上奔跑，阳光明媚"）
2. 选择视频生成模型（Runway / 可灵 / Seedance）
3. 点击生成，等待结果
4. 预览视频、下载保存

---

## 二、功能需求

### 2.1 生成页面（核心）

| 功能 | 说明 |
|------|------|
| 文字输入 | 多行文本框，字数提示 |
| 参数设置 | 分辨率、时长、风格（可选） |
| 模型选择 | 下拉切换 Runway / 可灵 / Seedance |
| 生成按钮 | 发起任务，显示进度 |
| 实时预览 | 生成完成后内嵌播放器 |

### 2.2 任务管理

| 功能 | 说明 |
|------|------|
| 任务列表 | 显示所有生成任务（状态/时间/模型） |
| 历史记录 | 已完成的视频，可回看/下载 |
| 任务状态 | 排队中 → 生成中 → 完成/失败 |
| 重新生成 | 复用参数再次生成 |

### 2.3 API 配置

| 功能 | 说明 |
|------|------|
| API Key 管理 | 每个厂商独立配置 API Key |
| 连接测试 | 一键测试 API 是否可用 |
| 默认模型 | 预置主流模型，开箱即用 |
| 参数模板 | 各厂商默认参数 |

---

## 三、视频 API 清单

### 预置厂商

| 厂商 | 模型 | API 地址 | 特点 |
|------|------|----------|------|
| **Runway** | gen4.5（Gen-3 Alpha 已下线） | api.dev.runwayml.com | 质量高，英文效果好 |
| **可灵 Kling** | kling-v2-master | api.klingai.com | 中文理解强，性价比高 |
| **Seedance** | doubao-seedance-2.0/2.5 | ark.cn-beijing.volces.com (字节·火山方舟) | 动态效果好，速度快 |

### API 调用流程（统一抽象）

```
用户输入 → 统一请求格式 → 厂商适配器 → 厂商 API → 统一响应 → 前端展示
                              │
                        ┌─────┼─────┐
                        ▼     ▼     ▼
                    Runway  Kling  Seedance
```

---

## 四、技术架构

### 4.1 总体架构

```
┌──────────────────────────────────────────────┐
│                前端 (React + Ant Design)      │
│  生成页 │ 任务列表 │ API 配置 │ 视频预览      │
├──────────────────────────────────────────────┤
│                后端 (Python FastAPI)          │
│  /api/generate │ /api/tasks │ /api/config    │
├──────────────────────────────────────────────┤
│              视频 API 适配层                  │
│  RunwayAdapter │ KlingAdapter │ SeedanceAdapter│
├──────────────────────────────────────────────┤
│              数据层 (SQLite)                  │
│  tasks │ api_configs │ video_files             │
└──────────────────────────────────────────────┘
```

### 4.2 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design 5 | 与现有项目一致 |
| 后端 | Python FastAPI + uvicorn | 异步高性能 |
| 数据库 | SQLite + SQLAlchemy | 轻量，单用户足够 |
| 视频存储 | 本地文件 + 静态服务 | 简单可靠 |
| 部署 | Nginx + systemd | ty66666.cloud |

### 4.3 数据库设计

```sql
-- 生成任务表
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,           -- 文字描述
    provider TEXT NOT NULL,         -- runway/kling/seedance
    model TEXT,                     -- 具体模型版本
    params JSON,                    -- 分辨率/时长/风格等
    status TEXT DEFAULT 'pending',  -- pending/processing/completed/failed
    video_url TEXT,                 -- 生成的视频路径
    error_message TEXT,             -- 失败原因
    duration REAL,                  -- 生成耗时(秒)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- API 配置表
CREATE TABLE api_configs (
    id TEXT PRIMARY KEY,
    provider TEXT UNIQUE NOT NULL,  -- 厂商标识
    api_key TEXT,                   -- API Key (加密存储)
    base_url TEXT,                  -- API 地址
    default_model TEXT,             -- 默认模型
    params_template JSON,           -- 参数模板
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 五、API 接口设计

### 5.1 生成接口

```
POST /api/generate
{
    "prompt": "一只猫在草地上奔跑",
    "provider": "kling",
    "model": "v1.6",
    "params": {
        "resolution": "720p",
        "duration": 5,
        "style": "realistic"
    }
}
→ {"task_id": "xxx", "status": "pending"}
```

### 5.2 任务查询

```
GET /api/tasks?page=1&size=20
GET /api/tasks/{task_id}
DELETE /api/tasks/{task_id}
```

### 5.3 API 配置

```
GET  /api/config              -- 获取所有配置
POST /api/config              -- 保存配置
POST /api/config/{provider}/test  -- 测试连接
```

### 5.4 视频文件

```
GET /api/videos/{task_id}     -- 获取视频文件
```

---

## 六、页面设计

### 6.1 页面结构

```
┌─────────────────────────────────────────────────┐
│  🎬 文生视频平台                    [API 配置]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─ 生成区域 ──────────────────────────────┐    │
│  │                                         │    │
│  │  📝 视频描述                            │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │ 一只猫在草地上奔跑，阳光明媚...  │    │    │
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  🤖 模型: [可灵 Kling v1.6 ▼]           │    │
│  │  📐 分辨率: [720p ▼]  ⏱ 时长: [5s ▼]  │    │
│  │                                         │    │
│  │  [🚀 生成视频]                          │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─ 预览区域 ──────────────────────────────┐    │
│  │                                         │    │
│  │     🎥 视频预览播放器                    │    │
│  │     [下载] [重新生成]                   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─ 历史记录 ──────────────────────────────┐    │
│  │  # │ 时间      │ 模型   │ 状态  │ 操作  │    │
│  │  1 │ 11-08 14:3│ Kling  │ ✅完成 │ ▶️ 📥│    │
│  │  2 │ 11-08 14:2│ Runway │ ⏳生成中│      │    │
│  │  3 │ 11-08 14:1│ Seedan │ ❌失败 │ 🔄  │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.2 API 配置弹窗

```
┌─ API 配置 ────────────────────────────┐
│                                       │
│  🟢 Runway                             │
│  API Key: [sk-••••••••••]  [测试连接] │
│  默认模型: [gen4.5 ▼]                 │
│                                       │
│  🟢 可灵 Kling                         │
│  API Key: [••••••••••]    [测试连接]  │
│  默认模型: [v1.6 ▼]                   │
│                                       │
│  🟢 Seedance (字节)                    │
│  API Key: [••••••••••]    [测试连接]  │
│  默认模型: [1.0 ▼]                    │
│                                       │
│                          [保存配置]    │
└───────────────────────────────────────┘
```

---

## 七、目录结构

```
video-generator/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置管理
│   ├── database.py          # SQLite + SQLAlchemy
│   ├── models.py            # 数据模型
│   ├── schemas.py           # 请求/响应 Schema
│   ├── adapters/
│   │   ├── base.py          # 基础适配器接口
│   │   └── providers.py     # Runway/Kling/Seedance 适配器
│   │   ├── kling.py         # 可灵 Kling
│   │   └── seedance.py      # 字节 Seedance
│   ├── routers/
│   │   ├── generate.py      # 生成接口
│   │   ├── tasks.py         # 任务管理
│   │   └── config.py        # API 配置
│   └── services/
│       ├── task_manager.py  # 异步任务管理
│       └── video_service.py # 视频文件服务
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Generate.tsx     # 生成页面
│   │   │   └── ApiConfig.tsx    # API 配置
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx  # 视频播放器
│   │   │   ├── TaskList.tsx     # 任务列表
│   │   │   └── ModelSelector.tsx# 模型选择器
│   │   ├── services/
│   │   │   └── api.ts           # API 调用
│   │   └── types/
│   │       └── index.ts         # 类型定义
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── videos/              # 生成的视频文件
│   └── video.db             # SQLite 数据库
└── deploy/
    ├── nginx.conf
    └── video-generator.service
```

---

## 八、开发计划

| 阶段 | 内容 | 工时 |
|------|------|------|
| **Phase 1** | 后端骨架 + 数据库 + API 框架 | 2h |
| **Phase 2** | 3 个厂商适配器 | 3h |
| **Phase 3** | 前端页面（生成+任务+配置） | 3h |
| **Phase 4** | 联调 + 测试 + 部署 | 2h |
| **合计** | | **10h** |

---

## 九、风险与对策

| 风险 | 对策 |
|------|------|
| API 调用超时 | 异步任务 + 轮询查询 |
| API Key 安全 | 加密存储 + 不回显 |
| 视频文件过大 | 限制分辨率/时长 + 压缩 |
| 厂商 API 变更 | 适配器层隔离 + 版本管理 |
