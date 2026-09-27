# 错题本系统 (MistakeBook) - 完整技术架构分析报告

> 分析日期: 2026-09-24
> 项目路径: /home/ubuntu/workplace/mistake-book

---

## 一、项目总览

**产品定位**: 面向小学生的综合性智能学习平台，集成错题管理、知识总结、学习方法、拓展实践等功能。
**技术架构**: 多服务架构 — Spring Boot 后端 + React 前端 + 微信小程序 + Python AI 服务(2个)
**部署环境**: 腾讯云服务器 (122.51.45.199) + Nginx 反向代理 + Vercel (前端CDN)

---

## 二、项目目录结构

```
mistake-book/
├── backend/                    # 主后端服务 (Spring Boot 3.2.5 + Java 23)
│   ├── pom.xml                 # Maven 依赖管理
│   ├── src/main/java/com/mistakebook/
│   │   ├── MistakeBookApplication.java    # 启动类
│   │   ├── config/             # 配置类 (6个)
│   │   ├── controller/         # 控制器 (11个)
│   │   ├── dto/                # 数据传输对象 (6个)
│   │   ├── entity/             # 实体类 (9个)
│   │   ├── exception/          # 全局异常处理
│   │   ├── interceptor/        # JWT 认证拦截器
│   │   ├── job/                # PowerJob 定时任务
│   │   ├── repository/         # JPA Repository (8个)
│   │   ├── service/            # 业务服务 (3个接口 + 3个实现)
│   │   └── util/               # 工具类 (5个)
│   ├── src/main/resources/
│   │   ├── application.yml     # 主配置文件
│   │   └── db/                 # 数据库脚本 (空)
│   ├── data/                   # H2 本地数据库文件
│   ├── uploads/                # 上传文件存储
│   └── logs/                   # 日志文件
│
├── frontend/                   # Web 前端 (React 18 + TypeScript + Vite)
│   ├── package.json
│   ├── vite.config.ts          # Vite 构建配置
│   ├── vercel.json             # Vercel 部署配置 (API代理)
│   ├── src/
│   │   ├── api/                # API 调用层 (4个模块)
│   │   ├── components/         # 公共组件
│   │   ├── context/            # React Context (认证状态)
│   │   ├── pages/              # 页面组件 (16个目录)
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── utils/              # 工具函数 (request, kbRequest, crypto)
│   │   ├── App.tsx             # 路由配置
│   │   └── main.tsx            # 应用入口
│   └── dist/                   # 构建产物
│
├── miniapp/                    # 微信小程序 (原生框架)
│   ├── app.js / app.json / app.wxss
│   ├── pages/                  # 小程序页面 (12个)
│   ├── components/             # 自定义组件
│   ├── utils/                  # 请求封装
│   └── images/                 # TabBar 图标
│
├── code-assistant/             # 代码助手前端 (React 19 + TypeScript + Vite 8)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/pages/CodeAssistant.tsx  # 单页面应用
│
├── agent-service/              # 代码助手后端 (Python + FastAPI + AgentScope)
│   ├── main.py                 # 多Agent服务 (5个角色)
│   ├── requirements.txt
│   ├── start.sh
│   └── .env / .env.example
│
├── knowledge-base/             # 知识库服务 (Python + FastAPI + RAG)
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/                    # API 路由 (4个)
│   ├── services/               # 核心服务 (4个)
│   ├── config/                 # 配置管理
│   ├── models/                 # Pydantic 模型
│   ├── utils/                  # 数据库工具
│   ├── data/                   # ChromaDB + 上传文件
│   ├── nginx-kb.conf           # Nginx 反向代理配置
│   ├── knowledge-base.service  # Systemd 服务配置
│   └── requirements.txt
│
├── docs/                       # 项目文档
├── PRD.md                      # 产品需求文档
├── README.md                   # 项目说明
├── deploy-code-assistant.sh    # 代码助手部署脚本
└── .gitignore
```

---

## 三、前端技术栈详解 (frontend/)

### 3.1 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^18.3.1 | UI 框架 |
| react-dom | ^18.3.1 | React DOM 渲染 |
| react-router-dom | ^6.26.0 | 路由管理 |
| antd | ^5.21.0 | UI 组件库 |
| @ant-design/icons | ^5.4.0 | 图标库 |
| axios | ^1.7.7 | HTTP 客户端 |
| zustand | ^4.5.5 | 状态管理 (已引入但主要用 Context) |
| dayjs | ^1.11.13 | 日期处理 |
| html2canvas | ^1.4.1 | HTML 转图片 (PDF导出) |
| jspdf | ^4.2.1 | PDF 生成 |
| react-dropzone | ^14.2.9 | 拖拽上传 |
| react-markdown | ^9.0.1 | Markdown 渲染 |
| typescript | ^7.0.2 | 类型系统 |
| vite | ^5.4.3 | 构建工具 |

### 3.2 路由配置 (App.tsx)

| 路径 | 页面组件 | 访问权限 |
|------|---------|---------|
| `/login` | LoginPage | 游客 (GuestRoute) |
| `/register` | RegisterPage | 游客 (GuestRoute) |
| `/dashboard` | DashboardPage | 需登录 (ProtectedRoute) |
| `/mistakes` | MistakeList | 需登录 |
| `/mistakes/add` | MistakeForm | 需登录 |
| `/mistakes/:id` | MistakeDetail | 需登录 |
| `/mistakes/edit/:id` | MistakeForm (编辑模式) | 需登录 |
| `/search` | SearchPage | 需登录 |
| `/knowledge-summary` | KnowledgeSummaryPage | 需登录 |
| `/math-special` | MathSpecialPage | 需登录 |
| `/learning-methods` | LearningMethodsPage | 需登录 |
| `/extended-practice` | ExtendedPracticePage | 需登录 |
| `/phonetic-learning` | PhoneticLearningPage | 需登录 |
| `/phonetic-practice` | PhoneticPracticePage | 需登录 |
| `/ai-tech` | AITechPage | 需登录 |
| `/performance` | PerformancePage | 需登录 |
| `/knowledge-base` | KnowledgeBasePage | 需登录 |

### 3.3 API 调用模块

#### auth.ts — 认证 API
- `login(data)` — POST `/api/auth/login` (密码前端Base64加密)
- `register(data)` — POST `/api/auth/register`
- `getCurrentUser()` — GET `/api/auth/me`

#### mistake.ts — 错题管理 API
- `getMistakeList(page, size)` — GET `/api/mistakes`
- `getMistake(id)` — GET `/api/mistakes/:id`
- `createMistake(data)` — POST `/api/mistakes`
- `updateMistake(id, data)` — PUT `/api/mistakes/:id`
- `deleteMistake(id)` — DELETE `/api/mistakes/:id`
- `updateMistakeStatus(id, status)` — PUT `/api/mistakes/:id/status`
- `searchMistakes(keyword, page, size)` — GET `/api/mistakes/search`
- `getMistakesBySubject(subject, page, size)` — GET `/api/mistakes/subject/:subject`
- `getSubjects()` — GET `/api/mistakes/subjects`

#### image.ts — 图片管理 API
- `uploadImage(file, mistakeId?, imageType)` — POST `/api/images/upload` (multipart/form-data)
- `getMistakeImages(mistakeId)` — GET `/api/images/mistake/:id`
- `deleteImage(id)` — DELETE `/api/images/:id`

#### knowledge.ts — 知识疑难点 API
- `getDoubt(semesterKey, subjectKey)` — GET `/api/knowledge/doubt`
- `saveDoubt(data)` — POST `/api/knowledge/doubt`

### 3.4 请求工具

#### request.ts (主 API)
- baseURL: `/api` (通过 Nginx 代理到后端 9999 端口)
- 自动添加 JWT Bearer Token
- 401 自动跳转登录页
- 网络错误/5xx 自动重试 (最多3次, 递增延迟)
- timeout: 15s

#### kbRequest.ts (知识库 API)
- baseURL: `/kb-api` (通过 Nginx 代理到 8001 端口)
- timeout: 300s (文档处理较长)

### 3.5 认证机制
- 使用 React Context (`AuthContext`) 管理认证状态
- Token 存储在 localStorage (`mistake_book_token`)
- 前端密码加密: Base64 编码
- 路由守卫: `ProtectedRoute` (需登录) / `GuestRoute` (仅游客)

### 3.6 类型定义 (types/index.ts)
- `Mistake` — 错题完整类型 (含 images 数组)
- `MistakeForm` — 错题表单类型
- `Subject` — 学科类型 (MATH/PHYSICS/CHEMISTRY/BIOLOGY/ENGLISH/CHINESE)
- `ApiResponse<T>` — 统一响应格式 (code/message/data/timestamp)
- `PageResponse<T>` — 分页响应格式
- `UserInfo` — 用户信息类型
- `LoginForm` / `RegisterForm` — 登录注册表单

---

## 四、后端技术栈详解 (backend/)

### 4.1 核心依赖 (pom.xml)

| 依赖 | 版本 | 用途 |
|------|------|------|
| spring-boot-starter-web | 3.2.5 | Web 框架 |
| spring-boot-starter-data-jpa | 3.2.5 | ORM 框架 |
| mysql-connector-j | (managed) | MySQL 驱动 |
| h2 | (managed) | H2 内存数据库 (开发) |
| spring-boot-starter-data-redis | (managed) | Redis 缓存 |
| spring-boot-starter-data-mongodb | (managed) | MongoDB 文档存储 |
| spring-boot-starter-validation | (managed) | 参数校验 |
| spring-security-crypto | (managed) | BCrypt 密码加密 |
| jjwt-api/impl/jackson | 0.12.5 | JWT 令牌 |
| knife4j-openapi3-jakarta | 4.3.0 | API 文档 (Swagger) |
| mapstruct | 1.5.5.Final | 对象映射 |
| lombok | (managed) | 代码简化 |
| powerjob-worker-spring-boot-starter | 5.1.1 | 分布式任务调度 |
| spring-boot-starter-test | (managed) | 测试框架 |
| **Java 版本** | **23** | |

### 4.2 Entity 实体类 (9个)

#### User (users 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| username | String(50) | 用户名 (唯一) |
| password | String | 密码 (BCrypt) |
| grade | Integer | 年级 1-12 |
| gender | Integer | 性别 0-未知/1-男/2-女 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### Mistake (t_mistake 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| title | String(200) | 题目摘要 |
| content | TEXT | 题目内容 |
| correctAnswer | TEXT | 正确答案 |
| wrongReason | TEXT | 错误分析 |
| subject | String(20) | 学科 (MATH/PHYSICS/CHEMISTRY/BIOLOGY/ENGLISH) |
| difficulty | Integer | 难度 1-5 |
| tags | String(500) | 标签 (逗号分隔) |
| status | Integer | 掌握状态 0-未掌握/1-半掌握/2-已掌握 |
| reviewCount | Integer | 复习次数 |
| nextReviewTime | LocalDateTime | 下次复习时间 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### MistakeImage (t_mistake_image 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| mistakeId | Long | 关联错题ID |
| imageUrl | String(255) | 图片URL |
| imageType | Integer | 类型 1-题目/2-答案/3-解析/4-其他 |
| sortOrder | Integer | 排序权重 |
| createTime | LocalDateTime | 创建时间 |

#### Tag (t_tag 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| name | String(50) | 标签名称 |
| color | String(7) | 标签颜色 (默认 #999999) |
| createTime | LocalDateTime | 创建时间 |

#### PerformanceCategory (performance_category 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| type | String(20) | 类型 EXAM/LEARNING/DAILY |
| name | String(50) | 分类名称 |
| maxScore | Integer | 满分值 (默认10) |
| sortOrder | Integer | 排序序号 |
| createTime | LocalDateTime | 创建时间 |

#### PerformanceRecord (performance_record 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| categoryId | Long | 分类ID |
| type | String(20) | 类型 EXAM/LEARNING/DAILY |
| title | String(200) | 标题 |
| score | BigDecimal(5,2) | 分数 |
| recordDate | LocalDate | 记录日期 |
| remark | String(500) | 备注 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### PerformanceSummary (performance_summary 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| periodName | String(50) | 周期名称 |
| startDate | LocalDate | 开始日期 |
| endDate | LocalDate | 结束日期 |
| examAvg | BigDecimal | 考试平均分 |
| learningAvg | BigDecimal | 学习平均分 |
| dailyAvg | BigDecimal | 日常平均分 |
| totalScore | BigDecimal | 总评分 |
| grade | String(5) | 等级 A+/A/B/C/D/D- |
| studentSummary | TEXT | 学生自评 |
| improvementPlan | TEXT | 改进计划 |
| parentComment | TEXT | 家长评语 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### RewardPunishment (reward_punishment 表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long (自增) | 主键 |
| userId | Long | 用户ID |
| grade | String(20) | 等级 |
| category | String(20) | 分类 REWARD/PUNISHMENT |
| subCategory | String(50) | 子分类 |
| detail | TEXT | 详情 |
| completed | Boolean | 是否已完成 |
| recordDate | LocalDate | 记录日期 |
| remark | String(500) | 备注 |
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### StudyLog (MongoDB: study_logs 集合)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | MongoDB ObjectId |
| userId | Long | 用户ID |
| action | String | 操作类型 |
| content | String | 内容 |
| createTime | LocalDateTime | 创建时间 |

### 4.3 Repository 接口 (8个)

| Repository | 实体 | 自定义查询 |
|-----------|------|-----------|
| UserRepository | User | findByUsername, existsByUsername |
| MistakeRepository | Mistake | findByUserIdOrderByCreateTimeDesc, findByUserIdAndSubject, searchByKeyword, findSubjectsByUserId |
| MistakeImageRepository | MistakeImage | findByMistakeId |
| TagRepository | Tag | findByUserIdOrderByCreateTimeDesc |
| PerformanceCategoryRepository | PerformanceCategory | (JPA标准方法) |
| PerformanceRecordRepository | PerformanceRecord | (JPA标准方法) |
| PerformanceSummaryRepository | PerformanceSummary | (JPA标准方法) |
| RewardPunishmentRepository | RewardPunishment | (JPA标准方法) |
| StudyLogRepository | StudyLog | (MongoDB Repository) |

### 4.4 Controller 控制器 (11个)

| Controller | 路径前缀 | 功能 |
|-----------|---------|------|
| AuthController | `/api/auth` | 用户注册、登录、获取当前用户、退出 |
| MistakeController | `/api/mistakes` | 错题 CRUD、搜索、按学科筛选、状态管理 |
| TagController | `/api/tags` | 标签 CRUD |
| ImageController | `/api/images` | 图片上传、获取、删除 |
| KnowledgeController | `/api/knowledge` | 知识疑难点管理 (Redis存储) |
| PerformanceController | `/api/performance` | 表现分类/记录/总结 CRUD |
| RewardPunishmentController | `/api/reward-punishment` | 奖惩记录 CRUD |
| AiNewsController | `/api/ai-news` | AI 热点文章、新技术发布 |
| AiResourcesController | `/api/ai-resources` | AI Skills/Plugins 数据 |
| HelloController | `/api/hello` | 健康检查 |
| TestController | `/api/test` | 系统信息测试 |

### 4.5 Service 服务层

| Service | 实现类 | 功能 |
|---------|-------|------|
| UserService | UserServiceImpl | 注册(BCrypt加密)、登录(JWT生成+Redis存储)、退出、Token验证 |
| MistakeService | MistakeServiceImpl | 错题CRUD、搜索、状态管理、分页查询 |
| PerformanceService | PerformanceServiceImpl | 表现分类/记录/总结管理、统计计算 |
| AiNewsService | (直接@Service) | AI新闻数据缓存、定时刷新 |

### 4.6 Config 配置类 (6个)

| 配置类 | 功能 |
|-------|------|
| CorsConfig | CORS 跨域配置 |
| Knife4jConfig | Swagger API 文档配置 |
| RedisConfig | Redis 序列化配置 (String+Jackson) |
| ResourceConfig | 静态资源映射 (uploads目录) |
| StorageProperties | 文件存储路径配置 |
| WebMvcConfig | JWT 拦截器注册 (排除白名单路径) |

### 4.7 工具类 (5个)

| 工具类 | 功能 |
|-------|------|
| JwtUtil | JWT 生成、解析、验证 (HMAC-SHA) |
| PasswordUtil | BCrypt 密码加密/验证 |
| RedisService | Redis 操作封装 (get/set/delete/hasKey) |
| Result<T> | 统一响应封装 (code/message/data/timestamp) |
| UserContext | ThreadLocal 存储当前用户ID |

### 4.8 JWT 认证流程
1. 用户登录 → 密码BCrypt验证 → 生成JWT Token → 存入Redis (7天过期)
2. 前端存储 Token 到 localStorage
3. 请求自动携带 `Authorization: Bearer <token>`
4. `JwtAuthInterceptor` 拦截 `/api/**` (白名单: register/login/hello/test/ai-news/ai-resources/docs)
5. 验证 Token 有效性 + Redis 中是否存在
6. 解析 userId 存入 `UserContext` (ThreadLocal)

---

## 五、数据库表结构

### 5.1 MySQL 数据库: `mistakebook`

**连接**: `122.51.45.199:3306` (生产) / H2 (开发)
**DDL策略**: `hibernate.ddl-auto=update` (自动同步)

| 表名 | 实体 | 说明 |
|------|------|------|
| users | User | 用户表 |
| t_mistake | Mistake | 错题表 |
| t_mistake_image | MistakeImage | 错题图片表 |
| t_tag | Tag | 标签表 |
| performance_category | PerformanceCategory | 表现分类表 |
| performance_record | PerformanceRecord | 表现记录表 |
| performance_summary | PerformanceSummary | 表现总结表 |
| reward_punishment | RewardPunishment | 奖惩记录表 |

### 5.2 MongoDB 数据库: `mistakebook`

**连接**: `122.51.45.199:27017`

| 集合 | 实体 | 说明 |
|------|------|------|
| study_logs | StudyLog | 学习日志 |

### 5.3 Redis

**连接**: `122.51.45.199:6379` (DB 0)

| Key 模式 | 用途 |
|----------|------|
| `user:token:{userId}` | JWT Token 存储 (7天过期) |
| `knowledge:doubt:{userId}:{semester}:{subject}` | 知识疑难点 (365天过期) |

### 5.4 ChromaDB (知识库向量数据库)

**存储路径**: `knowledge-base/data/chroma/`
**集合名**: `knowledge_base`
**Embedding模型**: BAAI/bge-m3 (1024维)

---

## 六、部署架构

### 6.1 服务器环境

| 组件 | 地址/端口 | 说明 |
|------|----------|------|
| 腾讯云服务器 | 122.51.45.199 | 主服务器 |
| Nginx | 80/443 | 反向代理 + 静态资源 |
| Spring Boot 后端 | 9999 | 主 API 服务 |
| 知识库服务 | 8001 | Python FastAPI |
| Agent 服务 | 8000 | Python FastAPI |
| MySQL | 3306 | 关系数据库 |
| Redis | 6379 | 缓存 |
| MongoDB | 27017 | 文档数据库 |
| PowerJob Server | 7700 | 任务调度中心 |
| PowerJob Worker | 27777 | 任务执行器 |

### 6.2 域名规划

| 域名 | 服务 | 部署方式 |
|------|------|---------|
| ty66666.cloud | 前端 Web | Nginx 静态 / Vercel |
| code.ty66666.cloud | 代码助手 | Nginx 静态 + API 代理 |

### 6.3 Nginx 反向代理配置

```nginx
# 知识库 API 代理
location /kb-api/ {
    proxy_pass http://127.0.0.1:8001/api/kb/;
    client_max_body_size 50m;
    proxy_read_timeout 300s;
}
```

### 6.4 服务管理

| 服务 | 管理方式 | 启动脚本 |
|------|---------|---------|
| Spring Boot 后端 | 直接运行 / nohup | `mvn spring-boot:run` |
| 知识库服务 | systemd (knowledge-base.service) | `start.sh` (uvicorn) |
| Agent 服务 | nohup 后台 | `start.sh` (python main.py) |
| 代码助手前端 | Nginx 静态文件 | `deploy-code-assistant.sh` |

### 6.5 Vercel 部署 (前端)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "http://68ec515f.r8.cpolar.top/api/$1" }
  ]
}
```

---

## 七、Python 服务详解

### 7.1 知识库服务 (knowledge-base/)

**技术栈**: FastAPI + SQLAlchemy + ChromaDB + Sentence-Transformers + RAG
**端口**: 8001
**LLM**: MiMo API (mimo-v2.6-pro)

#### API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/kb/documents/` | POST | 上传文档 |
| `/api/kb/documents/` | GET | 文档列表 |
| `/api/kb/documents/{id}` | GET/DELETE | 文档详情/删除 |
| `/api/kb/documents/search` | POST | 文档搜索 |
| `/api/kb/search/` | POST | 混合搜索 (语义+关键词) |
| `/api/kb/chat/` | POST | RAG 智能问答 |
| `/api/kb/categories` | GET/POST | 分类管理 |
| `/api/kb/tags` | GET | 标签列表 |

#### 核心服务

| 服务 | 功能 |
|------|------|
| VectorStore | ChromaDB 向量存储、语义搜索、关键词搜索、混合搜索 |
| EmbeddingService | Sentence-Transformers 文本向量化 (BAAI/bge-m3) |
| DocumentProcessor | 多格式文档解析 (txt/md/pdf/docx/pptx/xlsx/csv/json/xml/html/图片OCR) |
| RAGEngine | 检索增强生成 (MiMo LLM + 向量检索) |

#### 依赖

```
fastapi, uvicorn, sqlalchemy, pymysql, motor, redis
chromadb, sentence-transformers, langchain
python-docx, openpyxl, python-pptx, pypdf, pdfplumber
Pillow, paddleocr, paddlepaddle
openai-whisper
```

### 7.2 Agent 服务 (agent-service/)

**技术栈**: FastAPI + AgentScope + MiMo API
**端口**: 8000
**架构**: 多角色 AI Agent

#### Agent 角色

| 角色 | 功能 |
|------|------|
| analyst (需求分析师) | 理解需求、拆解功能点、输出结构化文档 |
| coder (高级程序员) | 根据需求编写高质量代码 |
| reviewer (代码审查员) | 审查代码质量、安全性、性能 |
| tester (测试工程师) | 生成单元测试 |
| debugger (调试专家) | 定位和修复代码问题 |

#### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/chat` | POST | 单 Agent 对话 |
| `/api/pipeline` | POST | 完整流水线 (需求→代码→审查→测试) |
| `/api/review` | POST | 代码审查 |
| `/health` | GET | 健康检查 |

#### 依赖

```
agentscope, fastapi, uvicorn, pydantic, python-dotenv, httpx
```

---

## 八、微信小程序 (miniapp/)

### 8.1 技术栈
- 微信原生框架 (WXML + WXSS + JS)
- Vant Weapp 组件库

### 8.2 页面清单 (12个)

| 页面 | 路径 | 功能 |
|------|------|------|
| 登录 | pages/login/login | 用户登录 |
| 注册 | pages/register/register | 用户注册 |
| 首页 | pages/dashboard/dashboard | 学习概览 |
| 错题列表 | pages/mistake-list/mistake-list | 错题列表 |
| 错题详情 | pages/mistake-detail/mistake-detail | 错题详情 |
| 错题表单 | pages/mistake-form/mistake-form | 添加/编辑错题 |
| 搜索 | pages/search/search | 错题搜索 |
| 数学专项 | pages/math-special/math-special | 数学练习 |
| 音标学习 | pages/phonetic-learning/phonetic-learning | 音标卡片 |
| 音标练习 | pages/phonetic-practice/phonetic-practice | 音标练习题 |
| AI技术 | pages/ai-tech/ai-tech | AI前沿技术 |
| 学习方法 | pages/learning-methods/learning-methods | 学习方法 |

### 8.3 TabBar 导航
- 首页 (dashboard)
- 错题 (mistake-list)
- 搜索 (search)
- 添加 (mistake-form)

### 8.4 请求封装
- 基于 `wx.request` 封装
- 自动携带 JWT Token
- 401 自动跳转登录
- 统一错误提示

---

## 九、代码助手 (code-assistant/)

### 9.1 技术栈
- React 19.2.8
- TypeScript 6.0
- Vite 8.2.0
- Ant Design 5.29.3 + Pro Components
- Axios

### 9.2 功能
- 单页面应用 (CodeAssistant.tsx)
- 支持 12 种编程语言
- 5 个 AI Agent 角色切换
- 聊天模式 + 流水线模式
- 代码审查多轮迭代

---

## 十、功能模块完整清单

### 10.1 错题管理模块
- ✅ 错题 CRUD (创建、查看、编辑、删除)
- ✅ 图片上传 (题目/答案/解析图片, 最多10张, 10MB限制)
- ✅ 学科分类 (数学/物理/化学/生物/英语/语文)
- ✅ 难度标记 (1-5星)
- ✅ 标签系统 (自定义标签, 颜色标记)
- ✅ 掌握状态跟踪 (未掌握/半掌握/已掌握)
- ✅ 关键词搜索
- ✅ 分页查询

### 10.2 用户系统
- ✅ 用户注册 (用户名/密码/年级/性别)
- ✅ 用户登录 (JWT + Redis Token)
- ✅ 密码加密 (前端Base64 + 后端BCrypt)
- ✅ 退出登录
- ✅ 路由守卫

### 10.3 知识总结模块
- ✅ 一年级到五年级知识总结
- ✅ 每个年级分上学期/下学期
- ✅ 每学期包含语文/数学/英语
- ✅ 疑难点保存到 Redis
- ✅ 静态 HTML 知识页面

### 10.4 数学专项模块
- ✅ 思维题 (22种题型)
- ✅ 计算题库
- ✅ 知识点
- ✅ 试卷生成 (在线预览 + PDF下载)

### 10.5 音标学习模块
- ✅ 48个国际音标
- ✅ 9种分类
- ✅ 音标卡片 (符号/类型/例词/发音描述)
- ✅ 单词发音

### 10.6 音标练习模块
- ✅ 随机30道题
- ✅ 5种题型
- ✅ 支持3-5年级

### 10.7 学习方法模块
- ✅ 语文学习方法 (8种)
- ✅ 数学学习方法 (8种)
- ✅ 英语学习方法 (8种)

### 10.8 AI前沿技术模块
- ✅ 46个AI技术介绍
- ✅ 热点文章
- ✅ 新技术发布
- ✅ 定时刷新

### 10.9 拓展实践模块
- ✅ 学生小实验
- ✅ 学习游戏 (24点/成语接龙/单词拼写/数独/知识问答)
- ✅ 课外学习
- ✅ 运动规则

### 10.10 表现记录模块
- ✅ 表现分类管理 (考试/学习/日常)
- ✅ 表现记录 CRUD
- ✅ 表现总结 (周期统计/等级评定)
- ✅ 学生自评/家长评语

### 10.11 奖惩记录模块
- ✅ 奖励记录 (学习进步/优秀作业/课堂表现等)
- ✅ 惩罚记录 (作业未完成/课堂违纪等)
- ✅ 按日期范围查询
- ✅ 完成状态管理

### 10.12 本地知识库模块
- ✅ 文档上传 (多格式支持)
- ✅ 文档管理 (列表/详情/删除)
- ✅ 语义搜索 + 关键词搜索 + 混合搜索
- ✅ RAG 智能问答 (MiMo LLM)
- ✅ 分类标签管理
- ✅ 向量化存储 (ChromaDB)

### 10.13 代码助手模块
- ✅ 多Agent协作 (需求分析/代码生成/代码审查/测试/调试)
- ✅ 完整开发流水线
- ✅ 12种编程语言支持
- ✅ 代码审查多轮迭代

---

## 十一、数据流架构图

```
┌──────────────────────────────────────────────────────────────┐
│                        客户端层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Web 前端    │  │  微信小程序   │  │  代码助手前端     │   │
│  │ React+AntD   │  │  原生框架    │  │  React 19        │   │
│  │ :3000/Vercel │  │              │  │  :code.ty666...  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                     Nginx 反向代理                            │
│              ty66666.cloud / code.ty66666.cloud               │
└────────┬──────────────┬──────────────┬───────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│ Spring Boot │ │ 知识库服务   │ │  Agent 服务   │
│ 后端 :9999  │ │ FastAPI     │ │  FastAPI     │
│             │ │ :8001       │ │  :8000       │
│ - 用户认证  │ │ - 文档管理  │ │ - 需求分析   │
│ - 错题管理  │ │ - 向量搜索  │ │ - 代码生成   │
│ - 表现记录  │ │ - RAG问答   │ │ - 代码审查   │
│ - 奖惩管理  │ │ - Embedding │ │ - 测试生成   │
└──────┬──────┘ └──────┬──────┘ └──────┬───────┘
       │               │               │
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│   MySQL     │ │  ChromaDB   │ │  MiMo API    │
│  :3306      │ │  本地文件    │ │  (LLM)      │
├─────────────┤ └─────────────┘ └──────────────┘
│   Redis     │
│  :6379      │
├─────────────┤
│  MongoDB    │
│  :27017     │
├─────────────┤
│  PowerJob   │
│  :7700      │
└─────────────┘
```

---

## 十二、安全机制

1. **认证**: JWT Token (7天过期) + Redis 存储
2. **密码**: 前端 Base64 编码 + 后端 BCrypt 加密
3. **拦截器**: JwtAuthInterceptor 拦截所有 `/api/**` (白名单排除)
4. **CORS**: 允许所有来源 (开发模式)
5. **文件上传**: 10MB 单文件 / 50MB 总请求限制
6. **SQL注入防护**: JPA/Hibernate 参数化查询

---

## 十三、关键配置文件索引

| 文件 | 路径 | 用途 |
|------|------|------|
| application.yml | backend/src/main/resources/ | 后端主配置 |
| pom.xml | backend/ | Maven 依赖 |
| package.json | frontend/ | 前端依赖 |
| package.json | code-assistant/ | 代码助手依赖 |
| requirements.txt | knowledge-base/ | 知识库Python依赖 |
| requirements.txt | agent-service/ | Agent服务Python依赖 |
| settings.py | knowledge-base/config/ | 知识库配置 |
| .env | agent-service/ | Agent服务环境变量 |
| .env | knowledge-base/ | 知识库环境变量 |
| vercel.json | frontend/ | Vercel部署配置 |
| nginx-kb.conf | knowledge-base/ | Nginx代理配置 |
| knowledge-base.service | knowledge-base/ | Systemd服务配置 |
| deploy-code-assistant.sh | 根目录 | 代码助手部署脚本 |