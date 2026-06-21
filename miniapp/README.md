# 错题本小程序

基于微信小程序的错题本学习系统，帮助学生高效管理和复习错题。

## 功能特性

- ✅ 用户注册/登录
- ✅ 错题 CRUD（创建、查看、编辑、删除）
- ✅ 图片上传（拍照/相册）
- ✅ 学科分类（数学、物理、化学、生物、英语、语文）
- ✅ 标签管理
- ✅ 掌握状态跟踪（未掌握、半掌握、已掌握）
- ✅ 关键词搜索
- ✅ 学习概览统计

## 项目结构

```
miniapp/
├── app.js                    # 小程序入口
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # 站点地图
├── pages/                    # 页面
│   ├── login/               # 登录页
│   ├── register/            # 注册页
│   ├── dashboard/           # 首页（学习概览）
│   ├── mistake-list/        # 错题列表
│   ├── mistake-detail/      # 错题详情
│   ├── mistake-form/        # 添加/编辑错题
│   └── search/              # 搜索页
├── components/               # 组件
├── utils/                    # 工具函数
│   ├── request.js           # 请求封装
│   └── util.js              # 通用工具
└── images/                   # 图标资源
```

## 使用说明

### 1. 配置 AppID

在 `project.config.json` 中替换 `appid` 为你自己的小程序 AppID：

```json
{
  "appid": "your-appid"
}
```

### 2. 配置服务器地址

在 `app.js` 中修改 `baseUrl` 为你的服务器地址：

```javascript
globalData: {
  baseUrl: 'https://ty66666.cloud'  // 生产环境
  // baseUrl: 'http://localhost:9999'  // 开发环境
}
```

### 3. 添加 TabBar 图标

从图标库下载图标放入 `images/` 目录，详见 `images/README.md`。

### 4. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 选择 `miniapp` 目录
4. 点击「导入」

## 接口说明

所有接口均需在请求头中携带 Token：

```
Authorization: Bearer <token>
```

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 退出登录 |
| GET | /api/auth/me | 获取当前用户 |

### 错题接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/mistakes | 获取错题列表 |
| GET | /api/mistakes/:id | 获取错题详情 |
| POST | /api/mistakes | 创建错题 |
| PUT | /api/mistakes/:id | 更新错题 |
| DELETE | /api/mistakes/:id | 删除错题 |
| GET | /api/mistakes/search | 搜索错题 |
| GET | /api/mistakes/subject/:subject | 按学科筛选 |

### 图片接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/images/upload | 上传图片 |
| GET | /api/images/mistake/:id | 获取错题图片 |

## 技术栈

- 微信小程序原生框架
- 后端：Spring Boot + MySQL + Redis
- 认证：JWT Token

## 开发团队

- 错题本系统开发团队

## 许可证

MIT License
