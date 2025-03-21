# 实时统计系统

本文档描述了MCP服务器平台的实时统计系统，包括统计数据模型、API接口和WebSocket集成。

## 功能特点

- **多维度统计数据**：系统级、开发者级和服务器级三个维度的统计
- **实时更新**：通过WebSocket推送最新统计数据
- **历史趋势**：展示数据随时间变化的趋势
- **自定义订阅**：用户可自行选择需要订阅的统计数据类型
- **高效查询**：优化的数据库查询和缓存机制
- **权限控制**：确保用户只能访问有权限的统计数据

## 数据模型

### 系统级统计

```typescript
interface SystemStats {
  totalServers: number;           // 系统中的服务器总数
  totalDownloads: number;         // 所有服务器的下载总量
  popularTags: Array<{            // 热门标签
    tag: string;
    count: number;
  }>;
  recentUpdates: number;          // 最近更新的服务器数量
  popularServers: Array<{         // 热门服务器
    id: string;
    name: string;
    key: string;
    downloads: number;
  }>;
  activeUsers: number;            // 活跃用户数量
  dailyDownloads: Array<{         // 每日下载趋势
    date: string;                 // 格式：YYYY-MM-DD
    count: number;
  }>;
}
```

### 开发者级统计

```typescript
interface DeveloperStats {
  totalServers: number;           // 开发者的服务器总数
  totalDownloads: number;         // 开发者的服务器总下载量
  averageRating: number;          // 开发者的服务器平均评分
  mostPopularServer: {            // 最受欢迎的服务器
    id: string;
    name: string;
    key: string;
    downloads: number;
    rating: string;
  } | null;
  recentServers: Array<{         // 最近的服务器
    id: string;
    name: string;
    key: string;
    createdAt: Date | null;
    downloads: number;
  }>;
  downloadTrend: Array<{         // 下载趋势（最近30天）
    date: string;                // 格式：YYYY-MM-DD
    count: number;
  }>;
}
```

### 服务器级统计

```typescript
interface ServerStats {
  id: string;                     // 服务器ID
  name: string;                   // 服务器名称
  key: string;                    // 服务器键名
  downloads: number;              // 总下载次数
  rating: number;                 // 平均评分
  dailyDownloads: Array<{         // 每日下载统计
    date: string;                 // 格式：YYYY-MM-DD
    count: number;
  }>;
  userRatings: {                  // 用户评分分布
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  topCountries: Array<{           // 下载量最高的国家/地区
    country: string;
    count: number;
  }>;
}
```

## REST API 接口

### 获取统计概览

```
GET /api/stats
```

**响应示例：**

```json
{
  "summary": {
    "serverCount": 245,
    "downloadCount": 15782,
    "activeUsers": 1289
  },
  "dailyDownloads": [
    {"date": "2023-06-10", "count": 123},
    {"date": "2023-06-11", "count": 145},
    {"date": "2023-06-12", "count": 167}
  ],
  "popularServers": [
    {
      "id": "srv_12345",
      "name": "高级语音处理服务器",
      "key": "voice-processing",
      "downloads": 1523
    }
  ]
}
```

### 获取开发者统计数据

```
GET /api/stats/developer
```

**响应示例：**

```json
{
  "totalServers": 12,
  "totalDownloads": 3254,
  "averageRating": 4.7,
  "mostPopularServer": {
    "id": "srv_12345",
    "name": "高级语音处理服务器",
    "key": "voice-processing",
    "downloads": 1523,
    "rating": "4.8"
  },
  "recentServers": [
    {
      "id": "srv_67890",
      "name": "图像识别服务器",
      "key": "image-recognition",
      "createdAt": "2023-06-01T08:12:34Z",
      "downloads": 423
    }
  ],
  "downloadTrend": [
    {"date": "2023-06-10", "count": 42},
    {"date": "2023-06-11", "count": 37},
    {"date": "2023-06-12", "count": 51}
  ]
}
```

### 获取服务器统计数据

```
GET /api/stats/server/:serverId
```

**响应示例：**

```json
{
  "id": "srv_12345",
  "name": "高级语音处理服务器",
  "key": "voice-processing",
  "downloads": 1523,
  "rating": 4.8,
  "dailyDownloads": [
    {"date": "2023-06-10", "count": 17},
    {"date": "2023-06-11", "count": 23},
    {"date": "2023-06-12", "count": 19}
  ],
  "userRatings": {
    "1": 3,
    "2": 5,
    "3": 12,
    "4": 47,
    "5": 128
  },
  "topCountries": [
    {"country": "CN", "count": 523},
    {"country": "US", "count": 342},
    {"country": "JP", "count": 189}
  ]
}
```

### 获取实时统计连接信息

```
GET /api/stats/realtime
```

**响应示例：**

```json
{
  "url": "wss://api.example.com/api/stats/ws?token=jwt_token_here",
  "activeConnections": 42,
  "availableStats": [
    { "type": "system", "description": "系统整体统计" },
    { "type": "developer", "description": "开发者个人统计" },
    { "type": "server", "description": "特定服务器统计" }
  ],
  "instructions": {
    "subscribe": { "type": "subscribe", "statsType": "system" },
    "unsubscribe": { "type": "unsubscribe", "statsType": "system" },
    "ping": { "type": "ping" }
  }
}
```

## WebSocket实时统计

### 连接WebSocket

使用以下URL格式连接到实时统计WebSocket服务：

```
WebSocket: /api/stats/ws?token={authToken}
```

其中，`{authToken}`是用户的JWT认证令牌。

### WebSocket消息格式

#### 客户端消息类型

1. **订阅统计数据**

```json
{
  "type": "subscribe",
  "statsType": "system"
}
```

`statsType`可选值：`system`, `developer`, `server`

如果选择`server`类型，需要另外发送服务器ID：

```json
{
  "type": "subscribe",
  "statsType": "server",
  "serverId": "srv_12345"
}
```

2. **取消订阅**

```json
{
  "type": "unsubscribe",
  "statsType": "system"
}
```

3. **心跳检测**

```json
{
  "type": "ping"
}
```

#### 服务器消息类型

1. **统计数据**

```json
{
  "type": "stats",
  "statsType": "system",
  "timestamp": 1686571234567,
  "data": {
    // 统计数据，格式与REST API返回一致
  }
}
```

2. **心跳响应**

```json
{
  "type": "pong",
  "timestamp": 1686571234567
}
```

3. **错误消息**

```json
{
  "type": "error",
  "message": "错误信息"
}
```

4. **请求数据**

```json
{
  "type": "request",
  "dataType": "serverId",
  "message": "请提供要监控的服务器ID"
}
```

### JavaScript WebSocket集成

以下是一个简单的JavaScript客户端集成示例：

```javascript
// 连接统计WebSocket
function connectToStatsWebSocket(token) {
  const wsUrl = `ws://localhost:3000/api/stats/ws?token=${token}`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('统计WebSocket已连接');
    
    // 发送心跳检测
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }));
    }
    
    // 订阅系统统计
    socket.send(JSON.stringify({
      type: 'subscribe',
      statsType: 'system'
    }));
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'stats':
          // 处理统计数据
          displayStats(message.statsType, message.data);
          break;
          
        case 'pong':
          // 心跳响应处理
          console.log('收到心跳响应');
          break;
          
        case 'error':
          // 处理错误
          console.error('服务器错误:', message.message);
          break;
          
        case 'request':
          // 处理服务器请求
          handleServerRequest(socket, message);
          break;
      }
    } catch (error) {
      console.error('处理WebSocket消息时出错:', error);
    }
  };
  
  socket.onclose = () => {
    console.log('统计WebSocket连接已关闭');
    // 可以在这里添加重连逻辑
  };
  
  socket.onerror = (error) => {
    console.error('统计WebSocket错误:', error);
  };
  
  return socket;
}

// 处理服务器请求
function handleServerRequest(socket, message) {
  if (message.dataType === 'serverId') {
    // 假设我们有一个选定的服务器ID
    const selectedServerId = 'srv_12345';
    
    socket.send(JSON.stringify({
      type: 'subscribe',
      statsType: 'server',
      serverId: selectedServerId
    }));
  }
}

// 显示统计数据
function displayStats(statsType, data) {
  console.log(`收到${statsType}统计数据:`, data);
  
  // 这里可以添加实际的UI更新逻辑
  switch (statsType) {
    case 'system':
      updateSystemStatsUI(data);
      break;
    case 'developer':
      updateDeveloperStatsUI(data);
      break;
    case 'server':
      updateServerStatsUI(data);
      break;
  }
}
```

## 最佳实践

1. **高效订阅管理**:
   - 只订阅当前需要的数据类型
   - 不活跃的标签页可以取消订阅，减少不必要的数据传输

2. **处理连接中断**:
   - 实现自动重连机制
   - 断线重连后重新订阅之前的数据类型

3. **数据缓存**:
   - 在客户端缓存静态或变化缓慢的数据
   - 减少服务器负载和网络流量

4. **错误处理**:
   - 妥善处理所有WebSocket错误
   - 实现优雅降级，在WebSocket不可用时回退到REST API

## 待办事项

1. **添加更多维度的统计数据**:
   - 用户设备统计
   - 用户地理位置分布
   - 服务性能指标

2. **增强数据可视化**:
   - 添加更多图表类型
   - 支持数据导出功能

3. **实现数据分析功能**:
   - 预测趋势
   - 异常检测

4. **优化性能**:
   - 实现更高效的数据缓存
   - 减少WebSocket消息大小 