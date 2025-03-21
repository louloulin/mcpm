# Webhooks API 文档

Webhooks 允许您的应用程序在特定事件发生时接收实时通知。例如，当用户创建、更新或删除服务器时，我们可以发送一个 HTTP POST 请求到您配置的 URL。

## 概述

- Webhooks 是以 HTTP POST 请求形式发送到您指定的 URL 的通知
- 每个 Webhook 可以订阅一个或多个事件类型
- 出于安全考虑，所有 Webhook 请求都带有签名用于验证
- 您最多可以配置 10 个活动的 Webhooks

## Webhook 事件类型

以下是可用的 Webhook 事件类型：

| 事件类型 | 描述 |
|---------|------|
| `user.created` | 当新用户注册时触发 |
| `user.updated` | 当用户信息更新时触发 |
| `server.created` | 当创建新服务器时触发 |
| `server.updated` | 当服务器信息更新时触发 |
| `server.deleted` | 当服务器被删除时触发 |
| `server.started` | 当服务器启动时触发 |
| `server.stopped` | 当服务器停止时触发 |

## API 端点

### 获取所有 Webhooks

```
GET /api/v1/webhooks
```

获取当前用户的所有 Webhooks。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |

#### 响应

```json
[
  {
    "id": "webhook_123456",
    "url": "https://example.com/webhook",
    "events": ["server.created", "server.updated"],
    "active": true,
    "secret": "whsec_1234...789",
    "createdAt": "2023-08-15T12:00:00Z",
    "updatedAt": "2023-08-15T12:00:00Z"
  }
]
```

### 创建 Webhook

```
POST /api/v1/webhooks
```

创建新的 Webhook。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |
| `Content-Type` | `application/json`，必需 |

#### 请求体

```json
{
  "url": "https://example.com/webhook",
  "events": ["server.created", "server.updated"],
  "active": true
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `url` | string | Webhook URL，必须是 HTTPS |
| `events` | array | 要订阅的事件类型数组，不能为空 |
| `active` | boolean | Webhook 是否处于活动状态，默认为 true |

#### 响应

```json
{
  "id": "webhook_123456",
  "url": "https://example.com/webhook",
  "events": ["server.created", "server.updated"],
  "active": true,
  "secret": "whsec_1234567890abcdef1234567890abcdef",
  "createdAt": "2023-08-15T12:00:00Z",
  "updatedAt": "2023-08-15T12:00:00Z"
}
```

### 获取单个 Webhook

```
GET /api/v1/webhooks/:id
```

获取特定 Webhook 的详细信息。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |

#### 响应

```json
{
  "id": "webhook_123456",
  "url": "https://example.com/webhook",
  "events": ["server.created", "server.updated"],
  "active": true,
  "secret": "whsec_1234...789",
  "createdAt": "2023-08-15T12:00:00Z",
  "updatedAt": "2023-08-15T12:00:00Z"
}
```

### 更新 Webhook

```
PATCH /api/v1/webhooks/:id
```

更新现有的 Webhook。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |
| `Content-Type` | `application/json`，必需 |

#### 请求体

```json
{
  "url": "https://updated-example.com/webhook",
  "events": ["server.created", "server.updated", "server.deleted"],
  "active": false
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `url` | string | 可选，新的 Webhook URL |
| `events` | array | 可选，新的事件类型数组 |
| `active` | boolean | 可选，新的活动状态 |

#### 响应

```json
{
  "id": "webhook_123456",
  "url": "https://updated-example.com/webhook",
  "events": ["server.created", "server.updated", "server.deleted"],
  "active": false,
  "secret": "whsec_1234...789",
  "createdAt": "2023-08-15T12:00:00Z",
  "updatedAt": "2023-08-15T13:00:00Z"
}
```

### 删除 Webhook

```
DELETE /api/v1/webhooks/:id
```

删除特定的 Webhook。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |

#### 响应

HTTP 状态码 204（无内容）表示删除成功。

### 触发 Webhook 事件

```
POST /api/v1/webhooks/events
```

手动触发 Webhook 事件。此端点主要用于测试目的。

#### 请求头

| 名称 | 描述 |
|------|------|
| `Authorization` | Bearer token，必需 |
| `Content-Type` | `application/json`，必需 |

#### 请求体

```json
{
  "type": "server.created",
  "data": {
    "id": "server_123456",
    "name": "测试服务器",
    "url": "https://example.com/server"
  }
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `type` | string | 要触发的事件类型 |
| `data` | object | 事件相关的数据 |

#### 响应

```json
{
  "success": true,
  "triggered": 2,
  "results": [
    {
      "id": "webhook_123456",
      "success": true,
      "statusCode": 200
    },
    {
      "id": "webhook_789012",
      "success": true,
      "statusCode": 200
    }
  ]
}
```

## Webhook 请求

当事件发生时，我们将发送 HTTP POST 请求到您配置的 URL。

### 请求头

| 名称 | 描述 |
|------|------|
| `Content-Type` | `application/json` |
| `X-Webhook-Signature` | HMAC 签名，用于验证请求的真实性 |
| `X-Event-Type` | 触发的事件类型 |
| `X-Request-ID` | 唯一请求 ID |

### 请求体

```json
{
  "type": "server.created",
  "data": {
    "id": "server_123456",
    "name": "新服务器",
    "description": "这是一个测试服务器",
    "url": "https://example.com/server",
    "createdAt": "2023-08-15T12:00:00Z"
  }
}
```

## 验证 Webhook 签名

为了确保请求的安全性，每个 Webhook 请求都包含一个 HMAC 签名。您应该使用此签名来验证请求的真实性。

签名格式为：`t=时间戳,v1=签名`

以下是如何在不同语言中验证签名的示例：

### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const [timestamp, signatureValue] = signature.split(',');
  const time = timestamp.split('=')[1];
  const hash = signatureValue.split('=')[1];
  
  const signedPayload = `${time}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedSignature)
  );
}

// 使用示例
const isValid = verifyWebhookSignature(
  req.body,
  req.headers['x-webhook-signature'],
  'your_webhook_secret'
);

if (isValid) {
  // 处理 Webhook 请求
} else {
  // 拒绝请求
}
```

### Python

```python
import hmac
import hashlib
import json
import time

def verify_webhook_signature(payload, signature, secret):
    timestamp, signature_value = signature.split(',')
    time_value = timestamp.split('=')[1]
    hash_value = signature_value.split('=')[1]
    
    signed_payload = f"{time_value}.{json.dumps(payload)}"
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(hash_value, expected_signature)

# 使用示例
is_valid = verify_webhook_signature(
    request.json,
    request.headers.get('X-Webhook-Signature'),
    'your_webhook_secret'
)

if is_valid:
    # 处理 Webhook 请求
else:
    # 拒绝请求
```

## 最佳实践

1. **始终验证签名** - 这是确保请求来自我们系统的唯一方法
2. **请求重试** - 我们会在收到非 2xx 响应时自动重试，使用指数退避策略
3. **建议使用队列** - 收到 Webhook 后立即响应，然后异步处理以避免超时
4. **监控失败** - 在您的系统中实现监控，跟踪 Webhook 失败和重试
5. **限制处理时间** - 您的端点应在 10 秒内响应，超时的请求将被视为失败

## 常见问题

### 我如何测试 Webhook？

您可以使用 `/api/v1/webhooks/events` 端点手动触发事件进行测试。在开发阶段，您也可以使用 [ngrok](https://ngrok.com/) 等工具创建临时的公共 URL 转发到您的本地开发环境。

### 如何更新 Webhook 密钥？

出于安全考虑，Webhook 密钥在创建后不能更改。如果您需要更新密钥，请删除现有的 Webhook 并创建一个新的。

### 我的 Webhook 没有接收到事件怎么办？

请检查以下几点：
1. 确认您的 Webhook 处于激活状态
2. 验证 URL 是否正确，并且可以从外部访问
3. 确保您订阅了正确的事件类型
4. 检查您的服务器日志中是否有错误信息

### 是否有并发限制？

是的，我们限制每秒最多向单个端点发送 10 个 Webhook 请求。超过此限制的请求将排队处理。 