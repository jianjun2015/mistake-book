# 架构说明 — 文生视频平台

> 版本: v2.0 | 更新: 2026-11-28 | 配套文档: [USER-GUIDE.md](./USER-GUIDE.md)、[PRD.md](./PRD.md)

## 一、总体架构

```
┌───────────────────────────────────────────────────────────────┐
│                  前端 React 18 + AntD 5 (Vite)                  │
│  生成(提示词构建/AI润色/分镜/评分) │ 视频库 │ 收藏 │ 素材库     │
│  Mock/真实模式 │ 内联 API Key │ 模型默认/自定义                  │
├───────────────────────────────────────────────────────────────┤
│   Nginx (ty66666.cloud)                                        │
│   /video/ → /var/www/video-generator (静态构建)                  │
│   /video-api/ → 127.0.0.1:8430/api/                            │
├───────────────────────────────────────────────────────────────┤
│                   后端 FastAPI (:8430)                          │
│  /api/generate │ /api/tasks │ /api/config │ /api/ai/*           │
│  adapters: Runway │ Kling │ Seedance │ Mock(测试)               │
│  services: video_service（厂商 URL 短时效 → 本地转存）           │
├───────────────────────────────────────────────────────────────┤
│        SQLite data/video.db │ 视频 data/videos/<id>.mp4         │
└───────────────────────────────────────────────────────────────┘
                    │ HTTPS + Bearer/JWT        │ MiMo LLM
        ┌───────────┼──────────┐               ▼
        ▼           ▼          ▼      token-plan-cn.xiaomimimo.com
      Runway      可灵 Kling  火山方舟 Seedance   (AI 润色/分镜)
```

## 二、模块说明

### backend/
| 模块 | 职责 |
|------|------|
| `main.py` | FastAPI 入口、CORS、启动 `init_db()` |
| `database.py` | SQLite/SQLAlchemy；默认厂商配置种子；**已下线模型启动时自动迁移** |
| `models.py` / `schemas.py` | 表模型 / Pydantic v2 Schema |
| `routers/generate.py` | 提交生成（厂商校验、Mock 即时完成、provider_task_id 记录） |
| `routers/tasks.py` | 任务列表/详情轮询/删除、`/videos/{id}` 视频下发（本地优先，远端兜底重定向） |
| `routers/config.py` | 厂商 API 配置（Key 脱敏）、连接测试、参数规格 |
| `routers/ai.py` | AI 辅助：`/ai/polish` 润色、`/ai/storyboard` 剧本→分镜、`/ai/enhance-shot` 分镜优化（MiMo LLM） |
| `adapters/base.py` | `BaseVideoAdapter` + `VideoGenerationResult` 统一抽象（`default_base_url` 兜底） |
| `adapters/providers.py` | Runway / Kling / Seedance 适配器 + **已下线模型拦截**（`RETIRED_MODELS`） |
| `adapters/mock.py` | Mock 测试适配器（无 Key 即时返回示例视频） |
| `services/video_service.py` | 任务完成即把厂商短时效 URL 转存 `data/videos/` |

### frontend/
| 模块 | 职责 |
|------|------|
| `pages/Generate.tsx` | 核心生成页：左右分栏、提示词构建器、标签、AI 润色/分镜、质量评分、Mock/真实切换、内联 Key 管理 |
| `pages/TaskList.tsx` | 视频库：任务列表、预览、下载、删除 |
| `pages/Favorites.tsx` / `pages/MaterialLibrary.tsx` | 收藏与素材库（localStorage 持久化） |
| `pages/ApiConfig.tsx` | 厂商 API 配置与连接测试 |
| `components/StoryboardGenerator.tsx` | 剧本→分镜脚本交互组件 |

## 三、厂商适配层（API 事实，2026-11-28 核实）

| 厂商 | Base URL | 鉴权 | 创建/查询 | 默认模型 |
|------|----------|------|-----------|----------|
| Runway | `https://api.dev.runwayml.com/v1` | `Bearer` + **必带** `X-Runway-Version: 2024-11-06` | `POST /text_to_video`、`GET /tasks/{id}` | `gen4.5` |
| 可灵 Kling | `https://api.klingai.com/v1` | Bearer（JWT / API Key） | `POST /videos/text2video`、`GET /videos/text2video/{id}` | `kling-v2-master` |
| Seedance | `https://ark.cn-beijing.volces.com/api/v3` | `Bearer`（火山方舟 API Key） | `POST /contents/generations/tasks`、`GET .../tasks/{id}` | `doubao-seedance-2-0-260128` |
| Mock | — | — | 本地即时完成 | `mock-v1` |

统一状态：`pending / processing / completed / failed`（Runway `THROTTLED`→pending；Seedance `expired/cancelled`→failed；Kling `succeed`→completed）。

### 已下线模型（直接移除 + 请求前拦截）
| 厂商 | 已下线/不可用标识 | 处置 |
|------|------------------|------|
| Runway | `gen3a_turbo`（2026-07-30 下线）、`gen4_aleph`、`gen3a`、`gen2` | `RETIRED_MODELS` 拦截并提示 `gen4.5`；存量配置启动自动迁移 |
| Seedance | `seedance-1-0`、`doubao-seedance-1-0-lite-t2v/i2v-250428`（厂商侧报“模型不存在”） | 拦截并提示 `doubao-seedance-2-0-260128`；存量配置启动自动迁移 |
| Kling | `kling-v1-6` 等 1.x 旧版 | 默认迁移至 `kling-v2-master` |

## 四、安全边界

1. **API Key**：仅存服务端 SQLite，接口一律脱敏回显（`sk-a****1234` / “内置测试模式”），空值提交不覆盖旧 Key。
2. **厂商 URL 不外泄不失效**：任务完成即下载至 `data/videos/`，`video_url` 改为稳定端点 `/video-api/videos/{id}`；删除任务同步删除本地文件。
3. **外部调用边界**：仅适配器与 AI 服务出网；`/videos/{id}` 只重定向到该任务记录过的厂商 URL。
4. **部署边界**：Nginx TLS 终结；`/video-api/` 反代后端；前端静态构建不带任何密钥。
5. **前端本地数据**：收藏/素材库存 localStorage（浏览器侧），不含敏感信息。

## 五、数据流（一次生成）

```
Generate 页 → POST /video-api/generate → tasks 落库 → adapter.generate()
   ├─ Mock: 即时 completed（示例视频）
   └─ 真实厂商: processing + provider_task_id
每 3s GET /video-api/tasks/{id} → adapter.query()
   → completed: download_video() 转存 data/videos/ → video_url=/video-api/videos/{id}
<video src=/video-api/videos/{id}>（Nginx → FastAPI → 本地文件）
```

## 六、版本链

| 版本 | 日期 | 内容 |
|------|------|------|
| v1.0 | 2026-11-27 | 文生视频平台初版：Runway/可灵/Seedance 三厂商适配 |
| v1.x | 2026-11-27 | Mock 测试模式、提示词构建器/分镜、模型选择+Key 弹窗、Tab 布局+素材库、生成页深度优化、真实 API 模式切换、AI 润色+剧本→分镜、剧本↔标签关联 |
| v2.0 | 2026-11-28 | 全局优化：**已下线模型直接移除并自动迁移存量配置**（gen3a_turbo/seedance-1-0/1.0 lite/kling-v1-6）；Runway 宽高比映射修复（9:16→720:1280）；`default_base_url` 兜底；厂商短时效 URL 完成即本地转存、删除任务清理文件、耗时统计；未知厂商 400 拦截；Pydantic v2 规范化；新增 18 项自动化测试与 requirements |
