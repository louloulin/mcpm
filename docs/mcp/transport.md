# MCP传输模块

MCP传输模块提供了对多种传输方式的统一抽象和实现，使MCP服务器能够通过不同的传输协议进行通信。

## 功能概述

- 支持多种传输类型(STDIO和HTTP/SSE)
- 统一的传输连接接口
- 连接生命周期管理
- 消息处理和分发
- 错误处理和重试机制
- 心跳和连接健康监控

## 架构设计

传输模块采用模块化设计，包含以下核心组件：

### 传输类型定义

```typescript
export enum MCPTransportType {
  STDIO = 'stdio',
  HTTP_SSE = 'http/sse'
}
```

### 接口层

- `TransportConnection`: 抽象传输连接，定义消息发送和接收接口
- `TransportProvider`: 抽象传输提供者，负责创建和管理连接
- `TransportManager`: 管理多种传输提供者和连接

### 实现层

- `BaseTransportConnection`: 提供共享的连接基本功能
- `StdioConnection` / `StdioTransportProvider`: 标准输入输出传输实现
- `HttpSseConnection` / `HttpSseTransportProvider`: HTTP/SSE传输实现

## 使用方法

### 初始化传输管理器

```typescript
import { transportManager, StdioTransportProvider, HttpSseTransportProvider } from './mcp/transport';

// 注册传输提供者
const stdioProvider = new StdioTransportProvider();
const httpSseProvider = new HttpSseTransportProvider(expressApp);

transportManager.registerProvider(stdioProvider);
transportManager.registerProvider(httpSseProvider);
```

### 创建连接

```typescript
// 创建STDIO连接
const stdioConfig = {
  transportOptions: {
    command: 'node',
    args: ['./my-server.js'],
    env: { NODE_ENV: 'production' }
  }
};
const stdioConnection = await transportManager.createConnection(MCPTransportType.STDIO, stdioConfig);

// 创建HTTP/SSE连接
const httpConfig = {
  transportOptions: {
    serverUrl: 'https://example.com/mcp/events',
    authToken: 'jwt-token',
    heartbeatInterval: 15000
  }
};
const httpConnection = await transportManager.createConnection(MCPTransportType.HTTP_SSE, httpConfig);
```

### 发送消息

```typescript
// 创建MCP消息
const message: MCPMessage = {
  id: '123',
  type: 'request',
  method: 'tool.execute',
  params: { name: 'example_tool', args: {} }
};

// 发送消息
await connection.send(message);
```

### 接收消息

```typescript
// 添加消息处理器
connection.addMessageHandler(async (message) => {
  if (message.type === 'response') {
    console.log('收到响应:', message);
  }
});
```

### 监听传入连接

```typescript
// 配置STDIO监听
await transportManager.listen(MCPTransportType.STDIO, {}, (connection) => {
  console.log(`新的STDIO连接: ${connection.id}`);
  
  // 处理连接...
});

// 配置HTTP/SSE监听(使用Express应用)
await transportManager.listen(MCPTransportType.HTTP_SSE, {
  transportOptions: {
    clientUrl: '/api/mcp/events'
  }
}, (connection) => {
  console.log(`新的HTTP/SSE连接: ${connection.id}`);
  
  // 处理连接...
});
```

### 关闭连接

```typescript
// 关闭单个连接
await connection.close();

// 关闭所有连接和提供者
await transportManager.closeAll();
```

## 传输配置选项

### STDIO传输选项

```typescript
export interface StdioTransportOptions {
  // 命令行和参数
  command?: string;
  args?: string[];
  // 环境变量
  env?: Record<string, string>;
  // 工作目录
  cwd?: string;
  // 心跳间隔(毫秒)
  heartbeatInterval?: number;
  // 是否重定向stderr到stdout
  redirectStderr?: boolean;
  // 输入流(默认为process.stdin)
  stdin?: Readable;
  // 输出流(默认为process.stdout)
  stdout?: Writable;
  // 错误流(默认为process.stderr)
  stderr?: Writable;
}
```

### HTTP/SSE传输选项

```typescript
export interface HttpSseTransportOptions {
  // 服务器URL
  serverUrl?: string;
  // 客户端URL
  clientUrl?: string;
  // 心跳间隔(毫秒)
  heartbeatInterval?: number;
  // 认证令牌
  authToken?: string;
  // 请求头
  headers?: Record<string, string>;
}
```

## 错误处理

传输模块提供了统一的错误处理机制：

1. 连接状态变更：连接状态从`CONNECTED`变为`ERROR`
2. 错误信息捕获：通过`TransportConnection.error`属性获取最后一个错误
3. 重试机制：配置重试策略，自动处理临时连接中断
4. 心跳监控：定期发送心跳消息，检测连接健康状态

## 扩展性

传输模块设计为可扩展的，如果需要增加新的传输类型，只需要：

1. 在`MCPTransportType`中添加新的传输类型
2. 实现对应的`TransportConnection`和`TransportProvider`接口
3. 将新的传输提供者注册到`transportManager`中

## 最佳实践

1. 根据使用场景选择合适的传输类型：
   - 服务器进程：使用STDIO传输
   - Web应用：使用HTTP/SSE传输
2. 配置适当的超时和重试策略
3. 实现健壮的错误处理
4. 使用事件处理器模式处理异步消息
5. 合理管理连接生命周期，避免资源泄漏 