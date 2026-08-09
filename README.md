# 📝 错题本系统 - 学生智能学习助手

一款帮助学生高效管理错题、提升学习效率的智能学习工具。

## 项目简介

错题本系统是一个面向小学生的综合性学习平台，集成了错题管理、知识总结、学习方法、拓展实践等功能。支持 Web 端和微信小程序，帮助学生系统化学习、高效复习。

## 功能模块

### 📝 错题管理
- 错题 CRUD（创建、编辑、删除、查看）
- 图片上传（题目、答案、解析图片）
- 学科分类（数学、物理、化学、生物、英语、语文）
- 难度标记（1-5星）
- 标签系统（自定义标签管理）
- 掌握状态跟踪（未掌握/半掌握/已掌握）
- 关键词搜索

### 👤 用户系统
- 用户注册（用户名、密码、年级、性别）
- 用户登录（JWT + Redis Token 存储）
- 密码加密（前端 Base64 + 后端 BCrypt）
- 退出登录

### 📚 知识总结
- 支持一年级到五年级
- 每个年级分上学期、下学期
- 每个学期包含语文、数学、英语三科
- 每科包含：总结、试卷、疑难点
- 支持下载 PDF
- 疑难点保存到 Redis

### 🔢 数学专项
- **思维题**：找规律、和差问题、年龄问题、植树问题、等量代换、排队问题、挂灯笼、时间问题、鸡兔同笼、盈亏问题、行程问题、周期问题、逻辑推理、数阵图、枚举法、工程问题、浓度问题、利润问题、几何面积、数论问题、比例问题、优化问题
- **计算题库**：四则混合运算、竖式计算、巧算、分数计算、应用题
- **知识点**：数与代数、图形与几何、统计与概率
- **试卷生成**：支持在线预览和下载 PDF，历史记录

### 🔤 音标学习
- 48个国际音标完整收录
- 分类：长元音、短元音、双元音、爆破音、摩擦音、破擦音、鼻音、边音、半元音
- 每个音标卡片：音标符号、类型、例词、发音描述
- 支持单词发音

### ✏️ 音标练习
- 随机生成30道题目
- 5种题型：根据音标选单词、根据单词选音标、选择正确音标、找发音不同、判断发音相同
- 支持三年级、四年级、五年级
- 词汇不超纲

### 📖 学习方法
- **语文**：阅读理解三步法、五感写作法、古诗词记忆法、字词积累本、段落分析法、作文提纲法、文言文入门法、修辞手法学习法
- **数学**：错题本学习法、画图解题法、口算速算法、应用题审题法、竖式计算规范法、巧算技巧、几何图形认知法、单位换算法
- **英语**：自然拼读法、情境学习法、单词卡片法、英语儿歌学习法、句型操练法、分级阅读法、语法归纳法、英语日记法
- 每种方法包含：具体步骤、来源、实际案例与成果

### 🤖 AI前沿技术
- 46个AI技术介绍（大语言模型、开源模型、AI Agent、图像生成、视频生成、AI编程、语音技术、RAG & 知识库、向量数据库）
- 热点文章（带热门标签）
- 新技术发布
- 每3小时自动刷新

### 🎯 拓展实践
- **学生小实验**：火山喷发、彩虹牛奶、鸡蛋浮沉、静电实验、植物生长、表面张力
- **学习游戏**：24点、成语接龙、单词拼写、数独、知识问答
- **课外学习**：经典阅读、教育纪录片、兴趣培养
- **运动规则**：足球、篮球、羽毛球、乒乓球、排球

## 技术栈

### 后端
- Java 23
- Spring Boot 3.2.5
- Spring Data JPA
- MySQL 8.0
- Redis
- MongoDB
- JWT 认证
- Knife4j (Swagger API 文档)
- PowerJob（分布式任务调度）
- Maven

### 前端
- React 18
- TypeScript
- Vite 5
- Ant Design 5
- React Router v6
- Axios

### 微信小程序
- 微信原生框架
- Vant Weapp 组件库

### 部署
- Nginx 反向代理
- Docker（Redis、MongoDB）
- 腾讯云服务器

## 快速启动

### 环境要求
- JDK 23+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0
- Redis
- MongoDB

### 后端启动

```bash
cd backend
mvn spring-boot:run
```

后端启动后访问：
- API 服务: http://localhost:9999
- API 文档: http://localhost:9999/doc.html

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问: http://localhost:3000

### 小程序启动

1. 下载 `miniapp` 目录
2. 微信开发者工具导入
3. 安装依赖：`npm install @vant/weapp`
4. 编译运行

## 项目结构

```
mistake-book/
├── backend/                          # 后端项目
│   ├── pom.xml
│   └── src/main/java/com/mistakebook/
│       ├── MistakeBookApplication.java
│       ├── config/                   # 配置类
│       ├── controller/               # 控制器
│       ├── dto/                      # 数据传输对象
│       ├── entity/                   # 实体类
│       ├── exception/                # 异常处理
│       ├── interceptor/              # 拦截器
│       ├── repository/               # 数据访问层
│       ├── service/                  # 业务逻辑层
│       └── util/                     # 工具类
├── frontend/                         # 前端项目
│   ├── src/
│   │   ├── api/                      # API接口
│   │   ├── components/               # 公共组件
│   │   ├── context/                  # Context
│   │   ├── pages/                    # 页面
│   │   ├── types/                    # 类型定义
│   │   └── utils/                    # 工具函数
│   └── public/                       # 静态资源
│       └── knowledge/                # 知识总结HTML
├── miniapp/                          # 微信小程序
│   ├── pages/                        # 页面
│   ├── utils/                        # 工具函数
│   └── images/                       # 图标资源
└── README.md
```

## API 接口

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 退出登录 |
| GET | /api/auth/me | 获取当前用户 |

### 错题接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/mistakes | 获取错题列表 |
| POST | /api/mistakes | 创建错题 |
| GET | /api/mistakes/{id} | 获取错题详情 |
| PUT | /api/mistakes/{id} | 更新错题 |
| DELETE | /api/mistakes/{id} | 删除错题 |
| PUT | /api/mistakes/{id}/status | 更新掌握状态 |
| GET | /api/mistakes/search | 搜索错题 |

### 图片接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/images/upload | 上传图片 |
| GET | /api/images/mistake/{id} | 获取错题图片 |
| DELETE | /api/images/{id} | 删除图片 |

### 知识疑难点接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/knowledge/doubt | 获取疑难点 |
| POST | /api/knowledge/doubt | 保存疑难点 |

### AI资讯接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/ai-news/hot | 获取热点文章 |
| GET | /api/ai-news/new-tech | 获取新技术发布 |

## 访问地址

- Web 端：https://ty66666.cloud/
- API 文档：https://ty66666.cloud/doc.html

## GitHub

https://github.com/jianjun2015/mistake-book

## 许可证

MIT License
