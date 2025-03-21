# 文件存储服务

MCP 平台的文件存储服务提供了一个统一的接口来管理和存储文件，支持多种存储后端。

## 功能特点

- **多存储后端支持**：支持本地文件系统，未来将支持 S3、Azure Blob Storage 等云存储服务
- **统一的 API 接口**：提供一致的 API 来上传、下载和管理文件
- **安全访问控制**：支持公共、私有和受保护的文件访问权限
- **元数据管理**：存储和检索文件的元数据信息
- **临时 URL 签名**：生成带有过期时间的安全下载链接
- **分类和过滤**：通过用户、实体、文件类型等属性过滤文件
- **批量操作**：支持批量删除等操作

## 存储配置

文件存储服务可以通过环境变量进行配置：

```env
# 存储提供者类型: local, s3, azure, gcp
FILE_STORAGE_TYPE=local

# 本地存储路径（用于local类型）
FILE_STORAGE_PATH=./storage

# 公共访问 URL 基础路径
FILE_STORAGE_PUBLIC_URL=http://localhost:3000

# 临时 URL 默认过期时间（秒）
FILE_STORAGE_URL_EXPIRATION=3600

# URL 签名密钥
FILE_STORAGE_SECRET=your-secret-key

# 以下为 S3 存储配置（用于s3类型）
# S3 存储桶名称
S3_BUCKET_NAME=mcp-files

# AWS 区域
AWS_REGION=us-east-1

# AWS 访问密钥
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# 可选：临时会话令牌
AWS_SESSION_TOKEN=your-session-token

# 可选：自定义终端节点（用于MinIO等兼容S3的服务）
AWS_ENDPOINT=http://localhost:9000

# 可选：强制使用路径样式的URL
AWS_FORCE_PATH_STYLE=true
```

### 存储提供者

目前支持以下存储提供者：

#### 本地文件系统 (LOCAL)

- 适用于开发环境或小型应用
- 文件直接存储在服务器的本地文件系统中
- 通过设置 `FILE_STORAGE_TYPE=local` 启用

#### Amazon S3 (S3)

- 适用于生产环境和大规模应用
- 文件存储在 Amazon S3 或兼容 S3 API 的存储服务中
- 支持 AWS S3、MinIO、DigitalOcean Spaces 等兼容 S3 API 的服务
- 通过设置 `FILE_STORAGE_TYPE=s3` 启用
- 需要配置 AWS 访问密钥和 S3 存储桶

## API 端点

### 上传文件

**端点**: `POST /api/storage/upload`

支持两种上传方式：
- 直接上传文件（multipart/form-data）
- 通过 URL 上传（application/json 带 url 字段）

#### 直接上传文件

使用 `multipart/form-data` 格式：

```http
POST /api/storage/upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="example.jpg"
Content-Type: image/jpeg

(二进制文件内容)
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="entityId"

server-123
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="entityType"

server
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="access"

public
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="metadata"

{"description":"服务器配置文件"}
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

#### 通过 URL 上传

使用 `application/json` 格式：

```http
POST /api/storage/upload
Content-Type: application/json

{
  "url": "https://example.com/image.jpg",
  "filename": "profile.jpg",
  "entityId": "user-123",
  "entityType": "profile",
  "access": "private",
  "metadata": {
    "description": "用户头像"
  }
}
```

#### 响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "example.jpg",
  "mimetype": "image/jpeg",
  "size": 12345,
  "uploadedAt": "2023-08-01T12:34:56.789Z",
  "userId": "user-123",
  "entityId": "server-123",
  "entityType": "server",
  "path": "55/550e8400-e29b-41d4-a716-446655440000_example.jpg",
  "url": "http://localhost:3000/api/storage/download/550e8400-e29b-41d4-a716-446655440000?expires=1659365696&signature=abcdef1234567890",
  "access": "public",
  "metadata": {
    "description": "服务器配置文件"
  }
}
```

### 下载文件

**端点**: `GET /api/storage/download/:fileId`

参数：
- `fileId`：文件 ID
- `signature`：签名（针对私有或受保护的文件，从获取文件元数据 API 或上传响应中获取）
- `expires`：过期时间戳（与签名一起使用）
- `download`：设为 `true` 强制下载
- `inline`：设为 `true` 内联显示

例如：

```
GET /api/storage/download/550e8400-e29b-41d4-a716-446655440000?expires=1659365696&signature=abcdef1234567890
```

### 查询文件

**端点**: `GET /api/storage/files`

查询参数：
- `userId`：按用户 ID 过滤
- `entityId`：按实体 ID 过滤
- `entityType`：按实体类型过滤
- `access`：按访问权限过滤（public, private, protected）
- `filename`：按文件名过滤（支持通配符）
- `mimetype`：按 MIME 类型过滤
- `minSize`：最小文件大小（字节）
- `maxSize`：最大文件大小（字节）
- `uploadedAfter`：上传日期范围开始
- `uploadedBefore`：上传日期范围结束
- `limit`：限制返回数量
- `offset`：结果偏移量

例如：

```
GET /api/storage/files?entityType=server&access=public&limit=10
```

响应：

```json
{
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "example.jpg",
      "mimetype": "image/jpeg",
      "size": 12345,
      "uploadedAt": "2023-08-01T12:34:56.789Z",
      "userId": "user-123",
      "entityId": "server-123",
      "entityType": "server",
      "path": "55/550e8400-e29b-41d4-a716-446655440000_example.jpg",
      "url": "http://localhost:3000/api/storage/download/550e8400-e29b-41d4-a716-446655440000",
      "access": "public",
      "metadata": {
        "description": "服务器配置文件"
      }
    }
    // 更多文件...
  ],
  "count": 1,
  "limit": 10,
  "offset": 0
}
```

### 获取单个文件信息

**端点**: `GET /api/storage/files/:fileId`

例如：

```
GET /api/storage/files/550e8400-e29b-41d4-a716-446655440000
```

响应：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "example.jpg",
  "mimetype": "image/jpeg",
  "size": 12345,
  "uploadedAt": "2023-08-01T12:34:56.789Z",
  "userId": "user-123",
  "entityId": "server-123",
  "entityType": "server",
  "path": "55/550e8400-e29b-41d4-a716-446655440000_example.jpg",
  "url": "http://localhost:3000/api/storage/download/550e8400-e29b-41d4-a716-446655440000",
  "access": "public",
  "metadata": {
    "description": "服务器配置文件"
  },
  "downloadUrl": "http://localhost:3000/api/storage/download/550e8400-e29b-41d4-a716-446655440000?expires=1659365696&signature=abcdef1234567890"
}
```

### 更新文件信息

**端点**: `PATCH /api/storage/files/:fileId`

请求体：

```json
{
  "filename": "new-filename.jpg",
  "access": "private",
  "metadata": {
    "description": "更新的描述"
  }
}
```

响应：更新后的文件元数据。

### 删除文件

**端点**: `DELETE /api/storage/files/:fileId`

响应：

```json
{
  "success": true,
  "message": "文件已成功删除"
}
```

### 批量删除文件

**端点**: `DELETE /api/storage/files`

请求体：

```json
{
  "fileIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f8500-e29b-41d4-a716-446655440000"
  ]
}
```

响应：

```json
{
  "successful": ["550e8400-e29b-41d4-a716-446655440000"],
  "failed": ["660f8500-e29b-41d4-a716-446655440000"],
  "total": 2,
  "successCount": 1,
  "failCount": 1
}
```

## 客户端示例

### 上传文件

```javascript
// 使用表单数据上传
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('entityId', 'server-123');
formData.append('entityType', 'server');
formData.append('access', 'public');
formData.append('metadata', JSON.stringify({ description: '服务器配置文件' }));

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Uploaded file:', result);

// 通过 URL 上传
const response = await fetch('/api/storage/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/image.jpg',
    filename: 'profile.jpg',
    entityId: 'user-123',
    entityType: 'profile',
    access: 'private',
    metadata: {
      description: '用户头像'
    }
  })
});

const result = await response.json();
console.log('Uploaded file from URL:', result);
```

### 查询文件

```javascript
const response = await fetch('/api/storage/files?entityType=server&access=public&limit=10');
const result = await response.json();
console.log('Files:', result.files);
```

### 下载文件

```javascript
// 获取文件信息和临时下载链接
const response = await fetch(`/api/storage/files/${fileId}`);
const file = await response.json();

// 使用临时链接下载
window.location.href = file.downloadUrl;

// 或者直接使用下载端点（对于公共文件）
window.location.href = `/api/storage/download/${fileId}?download=true`;
```

### 显示图片

```html
<img src="/api/storage/download/550e8400-e29b-41d4-a716-446655440000?inline=true" alt="Example image">
```

## 访问权限

文件存储服务支持三种访问权限：

1. **公共（public）**：任何人都可以访问，无需身份验证或签名
2. **私有（private）**：只有文件所有者可以访问，或使用签名 URL
3. **受保护（protected）**：只有文件所有者和经过授权的用户可以访问

## 注意事项

1. 对于生产环境，请务必设置安全的 `FILE_STORAGE_SECRET` 环境变量
2. 上传大文件需要调整 Next.js 的 API 路由配置，以增加最大请求大小限制
3. 本地存储仅适用于开发环境或小型应用，生产环境推荐使用云存储服务
4. 定期清理未使用的文件以节省存储空间
5. 监控存储使用量，避免存储空间耗尽

## 未来计划

1. 实现 Azure Blob Storage 和 Google Cloud Storage 适配器
2. 添加文件压缩和图像处理功能
3. 支持分块上传大文件
4. 添加文件版本控制
5. 支持文件夹结构和层次化组织
6. 实现更细粒度的访问控制机制 