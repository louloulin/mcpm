# 实时通知系统

本文档描述了MCP服务器平台的实时通知系统，包括通知模型、API接口和WebSocket集成。

## 功能特点

- 多种通知类型和分类支持
- 模板化通知创建
- 持久化通知存储
- 用户级别的通知设置
- 实时WebSocket推送
- 支持多种通知渠道(应用内、电子邮件、推送)
- 通知过期和自动清理

## 数据模型

通知系统使用以下核心数据模型：

### 通知类型

```typescript
enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}
```

### 通知分类

```typescript
enum NotificationCategory {
  SYSTEM = "system",
  SERVER = "server",
  USER = "user",
  SECURITY = "security",
  BILLING = "billing",
  PERFORMANCE = "performance",
}
```

### 通知数据

```typescript
interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read?: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  expiresAt?: Date;
}
```

### 通知设置

```typescript
interface NotificationSettings {
  id?: string;
  userId: string;
  enableAll: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categorySettings?: Record<NotificationCategory, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
}
```

## REST API 接口

### 获取通知列表

```
GET /api/notifications
```

查询参数:
- `unreadOnly` - 仅显示未读通知 (true/false)
- `category` - 按类别筛选
- `limit` - 分页限制
- `offset` - 分页偏移

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user123",
      "title": "服务器已启动",
      "message": "您的MCP服务器已成功启动",
      "type": "success",
      "category": "server",
      "read": false,
      "link": "/servers/123",
      "metadata": { "serverId": "123" },
      "createdAt": "2023-06-15T08:30:00Z",
      "expiresAt": "2023-06-22T08:30:00Z"
    },
    // ...更多通知
  ],
  "count": 5,
  "unreadCount": 3
}
```

### 获取单个通知

```
GET /api/notifications/{id}
```

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "title": "服务器已启动",
  "message": "您的MCP服务器已成功启动",
  "type": "success",
  "category": "server",
  "read": false,
  "link": "/servers/123",
  "metadata": { "serverId": "123" },
  "createdAt": "2023-06-15T08:30:00Z",
  "expiresAt": "2023-06-22T08:30:00Z"
}
```

### 创建通知(系统内部API)

```
POST /api/notifications
```

认证要求:
- 需要系统API密钥

请求体示例:

```json
{
  "userId": "user123",
  "title": "服务器已启动",
  "message": "您的MCP服务器已成功启动",
  "type": "success",
  "category": "server",
  "link": "/servers/123",
  "metadata": { "serverId": "123" },
  "expiresAt": "2023-06-22T08:30:00Z"
}
```

响应示例:

```json
{
  "success": true,
  "notificationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 标记通知已读

```
PATCH /api/notifications/{id}?markAsRead=true
```

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "success": true,
  "message": "通知已标记为已读"
}
```

### 标记所有通知已读

```
PATCH /api/notifications?category=server
```

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "success": true,
  "count": 5
}
```

### 删除通知

```
DELETE /api/notifications/{id}
```

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "success": true,
  "message": "通知已删除"
}
```

### 获取通知设置

```
GET /api/notifications/settings
```

认证要求:
- 需要有效的用户会话

响应示例:

```json
{
  "id": "settings123",
  "userId": "user123",
  "enableAll": true,
  "emailEnabled": true,
  "pushEnabled": true,
  "inAppEnabled": true,
  "categorySettings": {
    "server": {
      "enabled": true,
      "channels": ["in_app", "email", "push"]
    },
    "security": {
      "enabled": true,
      "channels": ["in_app", "email", "push"]
    }
  }
}
```

### 更新通知设置

```
PUT /api/notifications/settings
```

认证要求:
- 需要有效的用户会话

请求体示例:

```json
{
  "emailEnabled": false,
  "categorySettings": {
    "server": {
      "enabled": true,
      "channels": ["in_app"]
    }
  }
}
```

响应示例:

```json
{
  "id": "settings123",
  "userId": "user123",
  "enableAll": true,
  "emailEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "categorySettings": {
    "server": {
      "enabled": true,
      "channels": ["in_app"]
    },
    "security": {
      "enabled": true,
      "channels": ["in_app", "email", "push"]
    }
  }
}
```

## WebSocket实时通知

### 连接WebSocket

```
WebSocket: /api/notifications/ws?token={authToken}
```

其中`{authToken}`是用户的JWT认证令牌。

### WebSocket消息格式

#### 服务器发送的消息:

1. 连接确认:

```json
{
  "type": "connected",
  "userId": "user123",
  "timestamp": "2023-06-15T08:30:00Z"
}
```

2. 未读计数:

```json
{
  "type": "unreadCount",
  "count": 5,
  "timestamp": "2023-06-15T08:30:00Z"
}
```

3. 新通知:

```json
{
  "type": "notification",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user123",
    "title": "服务器已启动",
    "message": "您的MCP服务器已成功启动",
    "type": "success",
    "category": "server",
    "read": false,
    "link": "/servers/123",
    "metadata": { "serverId": "123" },
    "createdAt": "2023-06-15T08:30:00Z",
    "expiresAt": "2023-06-22T08:30:00Z"
  },
  "timestamp": "2023-06-15T08:30:00Z"
}
```

4. 标记已读确认:

```json
{
  "type": "readConfirmation",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "timestamp": "2023-06-15T08:30:05Z"
}
```

#### 客户端发送的消息:

1. 心跳检测:

```json
{
  "type": "ping"
}
```

2. 标记通知已读:

```json
{
  "type": "markAsRead",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 客户端集成示例

### JavaScript WebSocket集成

```javascript
// 连接通知WebSocket
const connectNotifications = (authToken) => {
  const wsUrl = `${API_BASE_URL}/api/notifications/ws?token=${authToken}`;
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('通知WebSocket已连接');
    // 发送心跳消息
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  };
  
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'notification':
        showNotification(data.data);
        break;
      case 'unreadCount':
        updateUnreadBadge(data.count);
        break;
      case 'readConfirmation':
        // 处理已读确认
        break;
      case 'connected':
        console.log(`通知服务已连接，用户ID: ${data.userId}`);
        break;
      case 'pong':
        // 心跳响应
        break;
    }
  };
  
  socket.onclose = () => {
    console.log('通知WebSocket连接已关闭');
    // 尝试重新连接
    setTimeout(() => connectNotifications(authToken), 5000);
  };
  
  socket.onerror = (error) => {
    console.error('通知WebSocket错误:', error);
  };
  
  return socket;
};

// 标记通知为已读
const markAsRead = (socket, notificationId) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'markAsRead',
      id: notificationId
    }));
  }
};
```

### 获取通知列表

```javascript
const fetchNotifications = async (authToken, options = {}) => {
  const { unreadOnly, category, limit, offset } = options;
  
  // 构建查询参数
  const params = new URLSearchParams();
  if (unreadOnly) params.append('unreadOnly', 'true');
  if (category) params.append('category', category);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  const response = await fetch(`${API_BASE_URL}/api/notifications${queryString}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`获取通知失败: ${response.statusText}`);
  }
  
  return response.json();
};
```

## 通知模板

系统支持通知模板，用于一致性消息格式和本地化支持。模板使用简单的变量替换机制。

### 模板示例:

```json
{
  "name": "server_started",
  "category": "server",
  "titleTemplate": "服务器已启动",
  "messageTemplate": "您的服务器 {{serverName}} 已成功启动，当前状态为 {{status}}。",
  "defaultType": "success",
  "variables": {
    "serverName": "服务器名称",
    "status": "服务器状态"
  }
}
```

### 使用模板创建通知:

```javascript
await fetch(`${API_BASE_URL}/api/notifications`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': SYSTEM_API_KEY
  },
  body: JSON.stringify({
    userId: 'user123',
    template: 'server_started',
    variables: {
      serverName: 'MCP-Test-01',
      status: '运行中'
    },
    link: '/servers/123',
    expiresInDays: 7
  })
});
```

## 最佳实践

1. **通知分类**
   - 合理使用不同通知分类，以便用户能更好地控制接收通知的偏好
   - 安全类通知应默认在所有渠道发送

2. **通知生命周期**
   - 为通知设置合理的过期时间
   - 对不同类型的通知使用不同的过期策略

3. **客户端实现**
   - 使用WebSocket进行实时通知接收
   - 定期使用REST API同步通知状态
   - 处理WebSocket连接中断和重连

4. **性能考虑**
   - 避免发送过多通知造成用户反感
   - 对同类型事件的通知可考虑合并(如多个服务器同时更新)

## 待办事项

- [ ] 实现电子邮件通知发送
- [ ] 添加移动推送通知支持
- [ ] 增加更多预设通知模板
- [ ] 改进通知分组和优先级处理
- [ ] 添加国际化支持 