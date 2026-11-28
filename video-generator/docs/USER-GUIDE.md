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

## 分镜生成与降级策略（v2.1）

「分镜脚本」支持两种填充方式，二者都会**直接填满表格中的画面描述列**：

1. **按描述生成分镜并填充**（组件内按钮）— 用「场景总体描述/剧本」拆镜头
2. **一键生成分镜并填充**（页面顶部）— 读取剧本输入框，生成后自动切换到分镜 tab

填充结果包含镜头号、镜头类型、画面描述、时长、转场（补全时附带氛围/台词）。

### 大模型不可用时

后端 `backend/services/storyboard_local.py` 提供**本地规则分镜生成器**作为兜底：
按句读切分剧本 → 均衡分配到目标镜头数 → 按叙事节奏分配镜头类型与转场 →
按时长取 3~4 秒 → 关键词判定氛围 → 把已选标签与光影词自然融入描述。

因此接口**不会**因 LLM 故障返回 502，而是返回：

```json
{ "shots": [...], "source": "local", "notice": "大模型配额已耗尽，已使用本地规则生成分镜" }
```

`source` 为 `ai` 表示大模型生成，`local` 表示已降级。前端会把 `notice` 以警示条展示，
并标明本次填充的数据来源。LLM 返回「结构合法但描述为空」的结果同样视为无效，自动降级补全。

## 模型选择与开通状态（v2.2）

平台区分两类模型，**不能混用**：

| 类型 | 端点 | 用途 | 计费 |
|------|------|------|------|
| 语言模型（Coding 套餐 14 个：Doubao-Seed / Kimi / DeepSeek / GLM） | `api/coding/v3/chat/completions` | AI 润色、分镜 | Coding 套餐额度 |
| 视频模型（Seedance 系列） | `api/v3/contents/generations/tasks` | 生成视频 | 独立按量/资源包 |

语言模型调用 Seedance 会报 `does not support the coding plan feature`。

### 模型版本下拉

「模型版本」不再硬编码，改为动态拉取账户真实状态：

- `GET /api/config/{provider}/models?probe=true` 先取方舟 `/api/v3/models` 中
  `domain=VideoGeneration` 的清单，再用非法 duration 逐个探测（不会创建付费任务）。
- 下拉项标注：✅ 可用 / ⛔ 未开通（ModelNotOpen）/ 🚫 不存在（NotFound）/ ❔ 未探测；
  未开通与不存在的项灰显禁选，全部不可用时给出开通指引。
- 探测结果服务端缓存 10 分钟。
- 语言模型清单见 `GET /api/ai/models`。

当前账户 2135031164 的 Seedance 模型均未开通，需到方舟控制台
`console.volcengine.com/ark → 开通管理` 单独开通后，下拉才会出现可选项。

## v2.3 语言模型下拉选择（分镜 / 润色）

分镜面板右侧新增「AI 语言模型」下拉框，数据来自 `GET /api/ai/models`：

| 通道 | 说明 |
| --- | --- |
| 火山方舟 Coding 套餐 | 13 个全小写规范名，均已在账户实测 200 |
| 小米 MiMo | 配额耗尽时自动降级到本地规则分镜 |

- 默认选中 `doubao-seed-2.1-pro`（后端 `DEFAULT_ARK_MODEL`）。
- 选中项作为 `llm_model` 透传给 `POST /api/ai/polish`、`POST /api/ai/storyboard`、`POST /api/ai/enhance-shot`。
- 模型名大小写不敏感：`GLM-5.3`、`Doubao-Seed-Evolving` 会被 `_normalize_model()` 归一化为小写规范名；`glm-latest` 别名映射到 `glm-5.3`。
- `kimi-k2.8-preview` 标注 preview；`kimi-k3` 已从清单移除（即将下线）。
- 编码套餐仅含语言模型，视频生成需另在方舟控制台逐个开通 Seedance 模型。

## v2.4 API 配置页（新增导航 Tab）

> 修复说明：`ApiConfig.tsx` 此前存在但**从未挂载到路由**，所以页面上根本看不到、也就“获取不到模型”。现在导航栏新增「⚙️ API 配置」Tab。

### 视频厂商区
- 每个厂商（Runway / 可灵 / Seedance / Mock）都有真实模型清单下拉（`GET /api/config/{provider}/models`）
- 支持直接手动输入模型名（AutoComplete）
- 「探测开通状态」按钮对应 `?probe=true`，实测每个模型：`✅ 可用 / ⛔ 未开通 / 🚫 不存在 / ❔ 未探测`
- 结果缓存 10 分钟，避免重复计费探测

### AI 语言模型区（方舟 Coding 套餐）
- 列出 13 个方舟语言模型 + MiMo，标注 preview
- 「探测可用性」实测每个模型（小请求，成本可忽略；并发执行，约 10 秒完成）
- 「设为默认」写入 `app_settings.ai.text_model`，**立即生效且重启后保留**（启动时 `load_runtime_settings()` 载入）
- 切换通道（方舟 / MiMo）会改变 `llm_client.channels()` 的优先级顺序

### 新增接口
| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/config/ai/text-models?probe=` | 语言模型清单 + 默认值 + 探测状态 |
| POST | `/api/config/ai/text-model` | 设置默认语言模型（入参 `model`、`channel`） |

`/api/ai/storyboard` 响应新增 `model` 字段，标明这次实际使用的模型。

## v2.5 真实链路修复（跑不通 = 说人话）

### 修掉的真实 bug
| 问题 | 影响 | 修复 |
| --- | --- | --- |
| 即时完成（Mock）任务不转存本地 | `video_url` 指向外链，`/api/videos` 返 307，页面可能播不出来 | 完成即 `download_video()`，失败回落外链 |
| 存的地址带 nginx 前缀 `/video-api/videos/{id}` | 直连后端 8430 访问 404 | 后端改存 `/api/videos/{id}`，前端用 `videoSrc()` 转前缀 |
| 下载无 UA 被 CDN 拦截 | Mock 示例视频偶发落盘失败 | 带浏览器 UA + 重试 2 次 |
| 厂商原始英文报错直接抛出 | 用户不知道该怎么办 | `preflight()` 提交前自检 + `_translate_error()` 中文翻译 |

### 现在失败会这样提示
- Runway Key 未以 `key_` 开头 → 直接拒绝，不发起任何网络请求（省钱省时）
- 可灵没按 `AK:SK` 填 → 提示去 app.klingai.com 取密钥对
- Seedance 用了 `/api/coding/v3` → 提示必须用 `/api/v3`
- 方舟 `ModelNotOpen` → 中文说明 + 控制台直属链接

### 新增接口
`GET /api/config/diagnose?probe=true` → 逐厂商 `ready / next_step / models`，配置页顶部「环境自检」卡片直接展示。

### 验真脚本
```bash
python3 scripts/verify_real.py --provider mock      # 无需 Key，验证全链路（已验证通过）
python3 scripts/verify_real.py --provider seedance   # 控制台开通后可一键验真
python3 scripts/verify_real.py --provider runway --key key_xxx
```
退出码 0 = 真实生成成功并校验 MP4 头；2 = 无可用模型；3/4 = 提交/生成失败；5 = 非法 MP4；6 = 超时。
