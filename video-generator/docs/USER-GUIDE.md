# 使用指南 — 文生视频平台

> 版本: v2.0 | 更新: 2026-11-28 | 线上地址: https://ty66666.cloud/video/

## 一、能力总览

- **智能生成**：文字描述 → 视频；支持提示词构建器、标签、AI 润色、剧本→分镜脚本、质量评分。
- **多厂商 + Mock**：Runway（gen4.5）、可灵 Kling（kling-v2-master）、Seedance（doubao-seedance 2.0/2.5），另有 🧪 Mock 测试模式（无需 Key 即时出片验证流程）。
- **视频库 / 收藏 / 素材库**：历史任务管理、收藏常用视频、沉淀素材（本地存储）。
- **视频落盘**：生成完成自动转存服务器，不受厂商 24 小时下载链接限制。
- **API 配置**：各厂商独立 Key、内联保存、连接测试；Key 脱敏显示。

## 二、页面导览

| 页面 | 用途 |
|------|------|
| 生成视频 | 左侧描述/提示词工具，右侧厂商/模型/分辨率/宽高比/时长配置；可切换 Mock 与真实模式 |
| 视频库 | 全部生成任务：预览、下载、删除、重新生成 |
| 收藏 | 常用视频收藏夹（保存在浏览器本地） |
| 素材库 | 常用图片/视频素材沉淀（保存在浏览器本地） |
| API 配置 | 厂商 Key 管理与连接测试 |

## 三、配置 API Key

在「生成页内联 API Key」或「API 配置」页填写并保存：

| 厂商 | Key 获取 | 说明 |
|------|----------|------|
| Runway | dev.runway.com Developer Portal | 密钥形如 `key_...`；旧 `gen3a_turbo` 模型已下线，系统自动使用 `gen4.5` |
| 可灵 Kling | 可灵开放平台 | Bearer JWT / API Key |
| Seedance | 火山方舟 API Key | 需先在控制台开通模型；2.x 系列需余额 > 200 元或节省计划/资源包 |
| Mock | 无需配置 | 内置测试模式，返回示例视频 |

## 四、生成视频

1. 输入描述（中文 ≤500 字最佳；对话放引号内利于配音生成）。
2. 选择厂商与参数：分辨率 480p–1080p、宽高比 16:9 / 9:16 / 1:1 / 4:3、时长 2–10s。
   - Runway 只支持横/竖两种输出（1280:720 / 720:1280），选择 9:16 会自动输出竖屏。
3. 模型默认用当前在售版本；高级用户可选「+ 自定义」填模型 ID。
4. 点击生成，页面自动轮询进度；完成后可预览/下载/收藏。

## 五、模型版本说明（已下线即移除）

| 厂商 | 当前默认 | 已下线不再提供 |
|------|----------|----------------|
| Runway | `gen4.5` | `gen3a_turbo`、`gen4_aleph`、`gen3a`、`gen2` |
| Seedance | `doubao-seedance-2-0-260128` | `seedance-1-0`、`doubao-seedance-1-0-lite-*` |
| Kling | `kling-v2-master` | `kling-v1-6` 及其他 1.x |

如误填已下线模型，系统会直接提示替代模型，不会发起无效请求。

## 六、本地启动 / 测试

```bash
cd video-generator
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements-dev.txt
.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8430   # 后端
.venv/bin/python -m pytest backend/tests -q                      # 测试（18 项）
cd frontend && npm install && npm run dev                        # 前端 :5180
```

环境变量：`VIDEO_GENERATOR_DATA_DIR` 重定位数据目录；`XIAOMI_API_KEY` 启用 AI 润色/分镜。

## 七、常见问题

| 现象 | 处理 |
|------|------|
| 提示「模型已下线/不可用」 | 按提示改用当前默认模型（见第五节） |
| Runway 报 key 格式错误 | 使用 `key_` 开头的 Developer Portal 密钥 |
| Seedance 报 `ModelNotOpen` | 到火山方舟控制台开通对应模型 |
| 生成很慢 | 各厂商通常 1–5 分钟，可离开页面，稍后回视频库查看 |
| 找不到旧视频 | 任务被删除会连同服务器文件一起清理；收藏页数据存在浏览器本地 |
