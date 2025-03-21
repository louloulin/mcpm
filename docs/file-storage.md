# 文件存储服务

MCP服务提供了灵活的文件存储服务，支持多种存储提供商，包括本地文件系统、Amazon S3和Azure Blob Storage等。

## 特性

- 抽象统一的API，便于切换不同的存储提供商
- 支持多种存储提供商：
  - 本地文件系统（开发环境）
  - Amazon S3（生产环境）
  - Azure Blob Storage（生产环境）
  - Google Cloud Storage（计划中）
- 文件元数据管理
- 访问控制（公共、私有、受保护）
- 临时URL生成
- 分类存储（按实体类型和ID组织文件）

## 配置

### 通用配置

在`.env`文件中配置文件存储服务：

```
# 存储类型: local, s3, azure
FILE_STORAGE_TYPE=local

# 本地存储目录（当使用local存储类型时）
FILE_STORAGE_PATH=./storage

# 公共URL前缀（可选）
FILE_STORAGE_PUBLIC_URL=http://localhost:3000/storage

# URL过期时间（秒）
FILE_STORAGE_URL_EXPIRATION=3600
```

### Amazon S3配置

当使用Amazon S3作为存储提供商时，需要配置以下环境变量：

```
FILE_STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your-bucket-name

# 可选配置
AWS_SESSION_TOKEN=your_session_token
AWS_ENDPOINT=https://custom-endpoint.com
AWS_FORCE_PATH_STYLE=true
```

### Azure Blob Storage配置

当使用Azure Blob Storage作为存储提供商时，需要配置以下环境变量：

```
FILE_STORAGE_TYPE=azure

# 连接方式一：使用连接字符串
AZURE_STORAGE_CONNECTION_STRING=your_connection_string

# 连接方式二：使用账户名和密钥
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_account_key

# 连接方式三：使用Azure托管身份
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_USE_DEFAULT_CREDENTIAL=true

# 其他配置
AZURE_STORAGE_CONTAINER=your-container-name
AZURE_STORAGE_URL_EXPIRATION=3600
AZURE_STORAGE_CUSTOM_DOMAIN=cdn.yourdomain.com
AZURE_STORAGE_CACHE_CONTROL=max-age=86400
```

## 使用方法

### 初始化存储服务

```typescript
import { FileStorageFactory } from '../lib/storage/FileStorageFactory';

// 使用默认配置（从环境变量获取）
const storageService = FileStorageFactory.getInstance().createDefaultStorageService();

// 或使用自定义配置
const factory = FileStorageFactory.getInstance();
const storageService = factory.createStorageService({
  type: StorageProviderType.AZURE,
  basePath: 'files',
  defaultUrlExpiration: 3600,
  providerOptions: {
    accountName: 'youraccount',
    accountKey: 'yourkey',
    // 其他配置...
  }
}, 'custom');
```

### 上传文件

```typescript
// 上传Buffer
const buffer = fs.readFileSync('./image.jpg');
const fileMetadata = await storageService.uploadFile(buffer, {
  filename: 'image.jpg',
  contentType: 'image/jpeg',
  entityType: 'users',
  entityId: '123',
  access: 'private',
  metadata: {
    description: '用户头像'
  }
});

// 上传流
const fileStream = fs.createReadStream('./document.pdf');
const fileMetadata = await storageService.uploadFile(fileStream, {
  filename: 'document.pdf',
  contentType: 'application/pdf',
  entityType: 'documents',
  entityId: '456',
  access: 'public'
});

// 从URL上传
const fileMetadata = await storageService.uploadFromUrl('https://example.com/image.png', {
  filename: 'remote-image.png',
  entityType: 'products',
  entityId: '789'
});
```

### 下载文件

```typescript
// 下载文件内容（返回Buffer）
const fileBuffer = await storageService.downloadFile(fileId);

// 获取下载URL
const fileUrl = await storageService.downloadFile(fileId, { asUrl: true, expiresIn: 1800 });
// 或
const fileUrl = await storageService.getDownloadUrl(fileId, 1800);
```

### 文件元数据管理

```typescript
// 获取文件元数据
const metadata = await storageService.getFileMetadata(fileId);

// 更新文件元数据
const updatedMetadata = await storageService.updateFileMetadata(fileId, {
  access: 'public',
  metadata: {
    description: '更新后的描述'
  }
});
```

### 删除文件

```typescript
// 删除单个文件
const success = await storageService.deleteFile(fileId);

// 批量删除文件
const results = await storageService.deleteFiles([fileId1, fileId2, fileId3]);
```

### 查找文件

```typescript
// 按条件查找文件
const files = await storageService.findFiles({
  entityType: 'users',
  entityId: '123',
  mimetype: 'image/jpeg',
  filename: '*.jpg',
  access: 'public',
  uploadedAfter: new Date('2023-01-01'),
  minSize: 1024,
  maxSize: 1024 * 1024 * 5
}, 10, 0);
```

## 实现自定义存储提供商

1. 创建实现`FileStorageService`接口的新类
2. 在`FileStorageFactory`中注册新的存储提供商类型
3. 更新`createDefaultStorageService`方法以支持新的类型

## 现有实现

### 本地文件存储 (LocalFileStorageService)

适用于开发环境，将文件存储在本地文件系统中。

### Amazon S3存储 (S3FileStorageService)

适用于生产环境，将文件存储在Amazon S3或兼容S3的服务中（如MinIO）。

### Azure Blob Storage (AzureFileStorageService)

适用于生产环境，将文件存储在Microsoft Azure Blob Storage中。

支持的功能：
- 多种认证方式（连接字符串、账户密钥、托管身份）
- 自定义域名支持（CDN集成）
- 元数据缓存
- 容器自动创建
- SAS令牌生成
- 缓存控制
- 所有标准文件操作 