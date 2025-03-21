# 第三方集成 API

本文档详细介绍了MCP服务器平台的第三方集成API，用于实现与IDE、AI助手等系统的集成。

## 概览

第三方集成功能允许MCP服务器连接到各种外部系统，如集成开发环境(IDE)、AI助手、CI/CD系统等。通过这些集成，您可以构建丰富的生态系统，让MCP服务器在各种环境中无缝工作。

## 基础URL

所有API请求都应该发送到以下基础URL：

```
https://your-mcp-server.com/api/v1/integrations
```

## 认证

所有API请求都需要通过认证。使用标准的Bearer Token认证方式：

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 集成类型

系统支持以下集成类型：

- `ide` - 集成开发环境 (VS Code, JetBrains, 等)
- `ai` - AI助手集成
- `cicd` - CI/CD系统集成
- `chat` - 聊天平台集成
- `custom` - 自定义集成

## API 端点

### 获取用户所有集成

```
GET /api/v1/integrations
```

获取当前认证用户的所有集成列表。

#### 请求

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`

#### 响应

**成功 - 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": "integration-id-1",
      "name": "我的VS Code集成",
      "type": "ide",
      "webhookUrl": "https://vscode-extension.example.com/webhook",
      "settings": {
        "notifyOnUpdate": true
      },
      "userId": "user-id",
      "enabled": true,
      "createdAt": "2023-05-15T10:30:00Z",
      "updatedAt": "2023-06-20T08:15:30Z"
    },
    {
      "id": "integration-id-2",
      "name": "ChatGPT插件",
      "type": "ai",
      "webhookUrl": null,
      "settings": {
        "autoSuggest": true,
        "includeMetadata": true
      },
      "userId": "user-id",
      "enabled": true,
      "createdAt": "2023-07-10T14:22:10Z",
      "updatedAt": "2023-07-10T14:22:10Z"
    }
  ]
}
```

**注意：** 出于安全考虑，API密钥不会包含在响应中。

### 获取单个集成详情

```
GET /api/v1/integrations/:id
```

获取指定ID的集成详情。

#### 请求

**URL参数:**

- `id` - 集成ID

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`

#### 响应

**成功 - 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": "integration-id-1",
    "name": "我的VS Code集成",
    "type": "ide",
    "webhookUrl": "https://vscode-extension.example.com/webhook",
    "settings": {
      "notifyOnUpdate": true
    },
    "userId": "user-id",
    "enabled": true,
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-06-20T08:15:30Z"
  }
}
```

**失败 - 404 Not Found:**

```json
{
  "success": false,
  "error": "集成不存在"
}
```

### 创建集成

```
POST /api/v1/integrations
```

创建新的第三方集成。

#### 请求

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`
- `Content-Type: application/json`

**Body:**

```json
{
  "name": "新VS Code集成",
  "type": "ide",
  "webhookUrl": "https://vscode-extension.example.com/webhook",
  "settings": {
    "notifyOnUpdate": true,
    "autoRefresh": false
  },
  "enabled": true
}
```

#### 响应

**成功 - 201 Created:**

```json
{
  "success": true,
  "data": {
    "id": "new-integration-id",
    "name": "新VS Code集成",
    "type": "ide",
    "webhookUrl": "https://vscode-extension.example.com/webhook",
    "settings": {
      "notifyOnUpdate": true,
      "autoRefresh": false
    },
    "userId": "user-id",
    "enabled": true,
    "createdAt": "2023-08-01T09:45:12Z",
    "updatedAt": "2023-08-01T09:45:12Z"
  }
}
```

**失败 - 400 Bad Request:**

```json
{
  "success": false,
  "error": "名称和类型为必填项"
}
```

或

```json
{
  "success": false,
  "error": "无效的集成类型",
  "validTypes": ["ide", "ai", "cicd", "chat", "custom"]
}
```

### 更新集成

```
PUT /api/v1/integrations/:id
```

更新现有集成的配置。

#### 请求

**URL参数:**

- `id` - 集成ID

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`
- `Content-Type: application/json`

**Body:**

```json
{
  "name": "更新后的VS Code集成",
  "webhookUrl": "https://new-webhook.example.com",
  "settings": {
    "notifyOnUpdate": false,
    "autoRefresh": true
  },
  "enabled": true
}
```

#### 响应

**成功 - 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": "integration-id",
    "name": "更新后的VS Code集成",
    "type": "ide",
    "webhookUrl": "https://new-webhook.example.com",
    "settings": {
      "notifyOnUpdate": false,
      "autoRefresh": true
    },
    "userId": "user-id",
    "enabled": true,
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-08-02T11:24:36Z"
  }
}
```

**失败 - 400 Bad Request:**

```json
{
  "success": false,
  "error": "未提供任何要更新的字段"
}
```

**失败 - 404 Not Found:**

```json
{
  "success": false,
  "error": "集成不存在或无权限"
}
```

### 删除集成

```
DELETE /api/v1/integrations/:id
```

删除指定的集成。

#### 请求

**URL参数:**

- `id` - 集成ID

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`

#### 响应

**成功 - 200 OK:**

```json
{
  "success": true,
  "message": "集成已删除"
}
```

**失败 - 404 Not Found:**

```json
{
  "success": false,
  "error": "集成不存在或无权限"
}
```

### 重新生成API密钥

```
POST /api/v1/integrations/:id/regenerate-key
```

为指定的集成重新生成API密钥。

#### 请求

**URL参数:**

- `id` - 集成ID

**Headers:**

- `Authorization: Bearer YOUR_ACCESS_TOKEN`

#### 响应

**成功 - 200 OK:**

```json
{
  "success": true,
  "data": {
    "apiKey": "mcp_new_api_key_here"
  }
}
```

**失败 - 404 Not Found:**

```json
{
  "success": false,
  "error": "集成不存在或无权限"
}
```

## 使用场景

### 1. IDE集成

通过IDE集成，开发者可以直接在IDE内部管理和使用MCP服务器：

- 服务器发现与安装
- 代码补全和自动提示
- 工具调用示例生成
- 服务器更新通知

### 2. AI助手集成

AI助手集成允许AI系统直接访问MCP服务器的元数据和功能：

- 获取服务器功能说明
- 生成使用示例
- 辅助解答与MCP相关的问题
- 推荐最适合特定任务的服务器

### 3. CI/CD集成

CI/CD集成可以自动化测试和部署MCP服务器：

- 自动测试服务器功能
- 自动部署更新
- 监控服务器健康状况
- 性能测试和基准测试

## 错误处理

所有API错误响应都会包含以下字段：

- `success`: 布尔值，始终为`false`表示请求失败
- `error`: 错误描述
- `message`: (可选) 更详细的错误信息

常见错误状态码：

- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 认证失败
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

## 安全建议

1. 保护API密钥安全，不要在客户端代码中暴露
2. 定期轮换API密钥
3. 只启用真正需要的集成
4. 对于Webhook URL，确保实施适当的认证和验证 