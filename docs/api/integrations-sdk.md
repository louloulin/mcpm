# MCP 第三方集成 SDK

MCP第三方集成SDK提供了一组工具和客户端库，简化第三方系统与MCP服务器的集成过程。无论您是开发IDE扩展、AI助手还是CI/CD工具，都可以通过本SDK快速实现与MCP服务器的连接和交互。

## 特性概览

- **多类型集成支持**: 内置IDE扩展、AI助手等多种集成类型的专用客户端
- **安全认证**: 支持API密钥和JWT令牌认证
- **类型安全**: 使用TypeScript开发，提供完整类型定义
- **错误处理**: 统一的错误处理机制，提高开发效率
- **事件支持**: 基于EventEmitter的事件机制，支持订阅MCP服务器事件

## 安装

```bash
# 使用npm
npm install @mcp/integration-sdk

# 使用pnpm
pnpm add @mcp/integration-sdk

# 使用yarn
yarn add @mcp/integration-sdk
```

## 基本使用

SDK提供了两种主要的集成客户端:

1. **IDEIntegrationClient**: 专为IDE扩展设计
2. **AIAssistantClient**: 专为AI助手设计

### 基础客户端初始化

```typescript
import { MCPIntegrationClient } from '@mcp/integration-sdk';

const client = new MCPIntegrationClient({
  baseUrl: 'https://your-mcp-server.com',
  apiKey: 'your-api-key',
  type: 'CUSTOM' // 集成类型
});

// 验证API密钥
const isValid = await client.verifyApiKey();

// 获取服务器元数据
const metadata = await client.getServerMetadata('server-key');

// 发送指标数据
await client.sendMetrics({
  action: 'custom_action',
  timestamp: new Date().toISOString()
});
```

## IDE集成

为IDE扩展提供了专用的客户端，简化与MCP服务器的集成。

```typescript
import { IDEIntegrationClient } from '@mcp/integration-sdk';

// 创建IDE客户端
const client = new IDEIntegrationClient(
  {
    baseUrl: 'https://your-mcp-server.com',
    apiKey: 'your-api-key'
  },
  {
    name: 'My VSCode Extension',
    version: '1.0.0',
    ideType: 'vscode',
    features: ['code-completion', 'diagnostics']
  }
);

// 注册IDE扩展
await client.registerExtension();

// 获取代码片段
const snippets = await client.getCodeSnippets('server-key', 'typescript');

// 订阅服务器更新
await client.subscribeToServerUpdates(['server-key1', 'server-key2']);

// 检查更新
const updates = await client.checkServerUpdates(['server-key1', 'server-key2']);

// 发送遥测数据
await client.sendTelemetry({
  action: 'code_completion',
  language: 'typescript'
});
```

## AI助手集成

为AI助手提供了专用客户端，用于获取MCP服务器工具和调用功能。

```typescript
import { AIAssistantClient } from '@mcp/integration-sdk';

// 创建AI助手客户端
const client = new AIAssistantClient(
  {
    baseUrl: 'https://your-mcp-server.com',
    apiKey: 'your-api-key'
  },
  {
    name: 'My AI Assistant',
    version: '1.0.0',
    assistantType: 'chatbot',
    capabilities: ['code-generation']
  }
);

// 注册AI助手
await client.registerAssistant();

// 获取可用工具
const tools = await client.getAvailableTools('server-key');

// 调用工具
const response = await client.callTool(
  'server-key',
  {
    toolName: 'code-generator',
    parameters: { language: 'typescript', prompt: 'Create a function' },
    callId: 'call-123'
  },
  {
    sessionId: 'session-456',
    userId: 'user-789'
  }
);

// 批量调用工具
const responses = await client.batchCallTools(
  'server-key',
  [request1, request2],
  sessionContext
);

// 获取模型配置
const modelConfig = await client.getModelConfig('server-key');

// 发送使用统计
await client.sendUsageStats({
  action: 'tool_call',
  toolName: 'code-generator'
});
```

## 工具函数

SDK提供了多种工具函数，用于认证、API请求等常见操作。

### 认证工具

```typescript
import { createAuthHeaders, validateApiKeyFormat, parseJwt } from '@mcp/integration-sdk';

// 创建认证头
const headers = createAuthHeaders({ apiKey: 'your-api-key' });

// 验证API密钥格式
const isValidFormat = validateApiKeyFormat('mcp_abcdef1234567890abcdef1234567890');

// 解析JWT令牌
const payload = parseJwt('your.jwt.token');

// 检查令牌是否过期
const isExpired = isTokenExpired('your.jwt.token');
```

### API工具

```typescript
import { createApiUrl, serializeBody, retryWithBackoff } from '@mcp/integration-sdk';

// 创建API URL
const url = createApiUrl('https://api.example.com', '/path', { param1: 'value1' });

// 序列化请求体
const body = serializeBody({ key: 'value' });

// 使用退避策略重试请求
const result = await retryWithBackoff(
  async () => {
    // 执行可能失败的异步操作
    return await fetch('https://api.example.com');
  },
  {
    maxRetries: 3,
    initialDelay: 300,
    factor: 2
  }
);
```

## 错误处理

SDK使用统一的`IntegrationError`类表示错误，包含错误类型、状态码和详情。

```typescript
try {
  // 执行可能失败的操作
  await client.getServerMetadata('server-key');
} catch (error) {
  if (error instanceof IntegrationError) {
    console.error(`错误类型: ${error.type}`);
    console.error(`状态码: ${error.statusCode}`);
    console.error(`错误详情: ${JSON.stringify(error.details)}`);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 事件订阅

基于`EventEmitter`，可以订阅和处理MCP服务器事件。

```typescript
// 订阅服务器更新事件
client.onEvent(EventType.SERVER_UPDATED, (data) => {
  console.log('服务器已更新:', data);
});

// 订阅集成创建事件
client.onEvent(EventType.INTEGRATION_CREATED, (data) => {
  console.log('新集成已创建:', data);
});
```

## 最佳实践

1. **安全存储API密钥**: 避免将API密钥硬编码在应用程序中，使用环境变量或安全的密钥管理系统
2. **错误处理**: 始终包含适当的错误处理逻辑，特别是在网络请求时
3. **资源清理**: 不再需要监听事件时，记得移除事件监听器
4. **性能考虑**: 对于频繁调用的操作，考虑实现缓存机制
5. **重试策略**: 使用`retryWithBackoff`函数处理临时网络故障

## 安全建议

1. **API密钥轮换**: 定期更新API密钥
2. **最小权限原则**: 为每个集成分配最小必要权限
3. **HTTPS**: 确保所有通信都通过HTTPS进行，SDK默认不允许非HTTPS连接
4. **验证服务器**: 实施证书固定，确保连接到合法服务器
5. **日志安全**: 确保日志不会记录敏感信息，如API密钥

## 支持与反馈

如有问题或建议，请通过以下方式联系我们:

- 提交GitHub Issue
- 发送邮件至support@mcp-server.com
- 访问我们的开发者社区: https://community.mcp-server.com 