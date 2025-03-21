# MCP 集成 SDK

MCP集成SDK提供了一组工具和客户端库，用于第三方系统与MCP服务器的无缝集成。

## 功能特性

- **多类型集成支持**: 支持IDE扩展、AI助手、CI/CD管道等多种集成类型
- **安全认证**: 内置API密钥验证和JWT令牌支持
- **错误处理**: 统一的错误处理机制，方便调试和解决问题
- **类型安全**: 使用TypeScript开发，提供完整的类型定义

## 安装

```bash
npm install @mcp/integration-sdk
# 或使用pnpm
pnpm add @mcp/integration-sdk
```

## 快速开始

### IDE集成示例

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
    telemetryEnabled: true
  }
);

// 注册扩展
await client.registerExtension();

// 获取服务器提供的代码片段
const snippets = await client.getCodeSnippets('server-key');

// 订阅服务器更新
await client.subscribeToServerUpdates(['server-key1', 'server-key2']);
```

### AI助手集成示例

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
    capabilities: ['code-generation', 'debugging'],
    telemetryEnabled: true
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
    parameters: { language: 'typescript', prompt: 'Create a React component' },
    callId: 'call-123'
  },
  {
    sessionId: 'session-456',
    userId: 'user-789'
  }
);
```

## API文档

### 核心类

- `MCPIntegrationClient`: 所有集成客户端的基类，提供与MCP服务器通信的基础功能
- `IDEIntegrationClient`: IDE集成客户端，专为IDE扩展提供功能
- `AIAssistantClient`: AI助手集成客户端，专为AI助手提供功能

### 实用工具

- `auth`: 提供认证相关函数，如创建认证头、验证API密钥等
- `api`: 提供API请求相关函数，如创建URL、序列化请求体等

## 贡献

欢迎通过Issue和Pull Request贡献代码。请确保遵循项目的代码风格和提交消息规范。

## 许可证

MIT 