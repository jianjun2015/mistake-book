# 📝 错题本系统 - 学生智能学习助手

## 项目简介

一款帮助学生高效管理错题的学习工具，支持文本录入、图片上传、OCR识别（预留接口）、学科分类、难度标记、标签管理、掌握状态跟踪等功能。

## 技术栈

### 后端
- **语言**: Java 23
- **框架**: Spring Boot 3.2.0
- **ORM**: Spring Data JPA
- **数据库**: H2（开发环境，可切换 MySQL）
- **API 文档**: Knife4j (Swagger)
- **构建工具**: Maven

### 前端
- **框架**: React 18 + TypeScript
- **UI 组件库**: Ant Design 5
- **构建工具**: Vite 5
- **状态管理**: Zustand（按需引入）
- **HTTP 客户端**: Axios
- **路由**: React Router v6

## 功能模块

| 模块 | 功能描述 |
|------|----------|
| 错题管理 | 创建、编辑、删除、查看错题 |
| 学科分类 | 数学、物理、化学、生物、英语、语文 |
| 图片上传 | 支持题目、答案、解析图片上传 |
| 难度标记 | 1-5星难度评级 |
| 标签系统 | 自定义标签管理 |
| 搜索功能 | 关键词搜索错题内容 |
| 掌握状态 | 未掌握/半掌握/已掌握 状态跟踪 |
| 学习概览 | 仪表盘统计掌握进度 |

## 快速启动

### 环境要求
- JDK 23+
- Node.js 18+
- Maven 3.8+

### 后端启动

```bash
cd backend
mvn spring-boot:run
```

后端启动后访问：
- API 服务: http://localhost:8080
- API 文档: http://localhost:8080/doc.html
- H2 控制台: http://localhost:8080/h2-console

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问: http://localhost:3000

## 项目结构

```
mistake-book/
├── backend/                          # 后端项目
│   ├── pom.xml
│   └── src/main/java/com/mistakebook/
│       ├── MistakeBookApplication.java   # 启动类
│       ├── config/                       # 配置类
│       │   ├── CorsConfig.java           # 跨域配置
│       │   ├── Knife4jConfig.java        # API文档配置
│       │   ├── ResourceConfig.java       # 静态资源配置
│       │   └── StorageProperties.java    # 存储配置
│       ├── controller/                   # 控制器
│       │   ├── MistakeController.java    # 错题CRUD
│       │   ├── ImageController.java      # 图片上传管理
│       │   └── TagController.java        # 标签管理
│       ├── dto/                          # 数据传输对象
│       │   ├── MistakeRequest.java       # 请求DTO
│       │   └── MistakeResponse.java      # 响应DTO
│       ├── entity/                       # 实体类
│       │   ├── Mistake.java              # 错题实体
│       │   ├── MistakeImage.java         # 错题图片
│       │   └── Tag.java                  # 标签实体
│       ├── exception/                    # 异常处理
│       │   └── GlobalExceptionHandler.java
│       ├── repository/                   # 数据访问层
│       │   ├── MistakeRepository.java
│       │   ├── MistakeImageRepository.java
│       │   └── TagRepository.java
│       ├── service/                      # 业务逻辑层
│       │   ├── MistakeService.java
│       │   └── impl/MistakeServiceImpl.java
│       └── util/                         # 工具类
│           └── Result.java               # 统一响应封装
│   └── src/main/resources/
│       └── application.yml               # 配置文件
├── frontend/                         # 前端项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx                      # 入口文件
│       ├── App.tsx                       # 根组件
│       ├── types/                        # 类型定义
│       │   └── index.ts
│       ├── utils/                        # 工具函数
│       │   └── request.ts                # HTTP请求封装
│       ├── api/                          # API接口
│       │   ├── mistake.ts
│       │   └── image.ts
│       ├── components/                   # 公共组件
│       │   ├── layout/
│       │   │   └── MainLayout.tsx
│       │   └── common/
│       │       ├── SearchBar.tsx
│       │       └── Dashboard.tsx
│       └── pages/                        # 页面
│           ├── DashboardPage.tsx         # 仪表盘
│           ├── MistakeList.tsx           # 错题列表
│           ├── MistakeForm.tsx           # 添加/编辑
│           ├── MistakeDetail.tsx         # 错题详情
│           └── SearchPage.tsx            # 搜索
└── docs/
    └── PRD.md                            # 产品需求文档
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/mistakes | 创建错题 |
| GET | /api/mistakes | 获取错题列表（分页） |
| GET | /api/mistakes/{id} | 获取错题详情 |
| PUT | /api/mistakes/{id} | 更新错题 |
| DELETE | /api/mistakes/{id} | 删除错题 |
| PUT | /api/mistakes/{id}/status | 更新掌握状态 |
| GET | /api/mistakes/search | 搜索错题 |
| GET | /api/mistakes/subject/{subject} | 按学科筛选 |
| GET | /api/mistakes/subjects | 获取学科列表 |
| POST | /api/images/upload | 上传图片 |
| GET | /api/images/mistake/{id} | 获取错题图片 |
| DELETE | /api/images/{id} | 删除图片 |

## 后续扩展

1. **OCR 识别** - 集成百度 AI / Tesseract.js，自动识别题目图片文字
2. **用户系统** - 多用户注册登录，错题本私有化
3. **复习计划** - 基于艾宾浩斯遗忘曲线的智能复习提醒
4. **AI 答疑** - 接入 LLM 为错题提供解析和建议
5. **数据分析** - 错题知识点图谱，薄弱点分析
6. **导出功能** - 导出为 PDF / Word 格式
