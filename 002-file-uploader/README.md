# 文件上传与管理平台

一个完整的文件上传与管理平台，包含前端和后端。

## 项目结构

```
002-file-uploader/
├── client/                # 前端项目 (React 19 + Tailwind CSS)
│   ├── src/
│   │   ├── components/    # React 组件
│   │   │   ├── Layout.jsx      # 布局组件
│   │   │   ├── Login.jsx       # 登录组件
│   │   │   ├── FileUpload.jsx  # 文件上传组件（拖拽上传、进度条）
│   │   │   └── FileList.jsx    # 文件列表组件（预览、下载、删除）
│   │   ├── services/      # API 服务层
│   │   │   └── api.js
│   │   ├── lib/           # 工具函数
│   │   │   └── utils.js
│   │   ├── App.jsx        # 主应用组件
│   │   ├── main.jsx       # 入口文件
│   │   └── index.css      # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── server/                # 后端项目 (Express + Multer)
│   ├── server.js          # 主服务器文件
│   ├── .env               # 环境变量
│   └── package.json
└── README.md
```

## 功能特性

### 前端
- ✅ React 19 + Vite 构建
- ✅ Tailwind CSS 样式框架
- ✅ 拖拽上传（react-dropzone）
- ✅ 实时上传进度条
- ✅ 图片文件预览
- ✅ 文件下载
- ✅ 文件删除
- ✅ JWT 登录鉴权
- ✅ 响应式设计

### 后端
- ✅ Express 框架
- ✅ Multer 文件上传处理
- ✅ JWT 身份验证
- ✅ 文件存储（本地文件系统）
- ✅ 文件列表查询接口
- ✅ 文件删除接口
- ✅ 文件预览/下载接口
- ✅ CORS 跨域支持
- ✅ 错误处理中间件

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 安装与运行

### 环境要求

- Node.js >= 16.x
- npm 或 yarn

### 后端启动

1. 进入后端目录：
```bash
cd server
```

2. 安装依赖：
```bash
npm install
```

3. 启动服务器：
```bash
npm start
# 或开发模式
npm run dev
```

后端服务将在 `http://localhost:5000` 运行。

### 前端启动

1. 进入前端目录：
```bash
cd client
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 运行。

## API 接口

### 认证

#### 登录
```
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

响应：
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "1",
    "username": "admin"
  }
}
```

### 文件操作

所有文件操作都需要在请求头中携带 JWT Token：
```
Authorization: Bearer <token>
```

#### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- file: 文件
```

响应：
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "originalName": "filename.jpg",
    "filename": "uuid-filename.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadDate": "2024-01-01T00:00:00.000Z",
    "url": "/api/files/filename.jpg"
  }
}
```

#### 获取文件列表
```
GET /api/files
```

响应：
```json
{
  "files": [
    {
      "id": "uuid",
      "filename": "uuid-filename.jpg",
      "size": 1024000,
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "url": "/api/files/filename.jpg"
    }
  ]
}
```

#### 获取/下载文件
```
GET /api/files/:filename
```

#### 删除文件
```
DELETE /api/files/:filename
```

响应：
```json
{
  "message": "File deleted successfully",
  "filename": "uuid-filename.jpg"
}
```

## 环境变量配置

后端 `.env` 文件配置：

```env
PORT=5000                    # 服务端口
JWT_SECRET=your-secret-key   # JWT 密钥（生产环境请修改）
ADMIN_USERNAME=admin         # 管理员用户名
ADMIN_PASSWORD=admin123      # 管理员密码
UPLOAD_DIR=./uploads         # 文件上传目录
MAX_FILE_SIZE=10485760       # 最大文件大小（10MB）
```

## 技术栈

### 前端
- **React 19** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - CSS 框架
- **Axios** - HTTP 客户端
- **react-dropzone** - 拖拽上传组件
- **Lucide React** - 图标库
- **framer-motion** - 动画库

### 后端
- **Express.js** - Web 框架
- **Multer** - 文件上传处理
- **JWT (jsonwebtoken)** - 身份验证
- **bcryptjs** - 密码加密
- **cors** - 跨域支持
- **dotenv** - 环境变量
- **fs-extra** - 文件系统操作
- **uuid** - 唯一ID生成

## 注意事项

1. **生产环境部署**：
   - 修改 `.env` 中的 `JWT_SECRET`
   - 修改管理员密码
   - 考虑使用数据库存储文件信息
   - 考虑使用云存储（如 AWS S3、阿里云 OSS 等）

2. **安全考虑**：
   - 当前实现中密码是硬编码的，生产环境应使用数据库
   - 文件类型限制可根据需求调整
   - 可以添加文件病毒扫描功能

3. **性能优化**：
   - 大文件上传可考虑分片上传
   - 添加文件压缩功能
   - 实现 CDN 加速

## 开发指南

### 添加新的文件类型支持

在 `server/server.js` 的 `fileFilter` 函数中添加文件类型过滤：

```javascript
fileFilter: (req, file, cb) => {
  // 示例：只允许图片文件
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
}
```

### 前端添加新功能

所有组件都在 `client/src/components/` 目录下，可以根据需要扩展：

- `FileUpload.jsx` - 文件上传组件
- `FileList.jsx` - 文件列表组件
- `Login.jsx` - 登录组件
- `Layout.jsx` - 布局组件

## 许可证

MIT License
