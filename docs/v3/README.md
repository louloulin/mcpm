# MCPM 3.0 文档

MCPM 3.0 是 MCP (Model Control Protocol) 生态系统的重要升级，提供了更简单、更统一、更强大的 API 和工具，帮助开发者快速创建、部署和管理 MCP 服务。

## 特性概述

- **简化的 API**: 声明式 API 设计，减少样板代码
- **统一的注册表**: 联合多个注册表源，提供统一的服务发现和安装机制
- **强大的服务器**: 内置中间件、插件支持和安全机制
- **灵活的客户端**: 动态工具代理、缓存管理和重试机制
- **完全向后兼容**: 100% 兼容现有 MCPM 功能和命令

## 快速开始

### 安装

```bash
npm install mcpm@^3.0.0
# 或者
npx mcpm@latest
```

### 创建服务器

使用声明式 API 创建一个简单的 MCP 服务器：

```javascript
const { v3 } = require('mcpm');
const { defineTool, createServer } = v3.server;
const { z } = require('zod');

// 定义工具
const greetingTool = defineTool({
  name: 'greeting',
  description: '生成问候消息',
  
  // 使用 Zod 定义输入架构
  input: z.object({
    name: z.string().min(1, '名字不能为空'),
    formal: z.boolean().optional().default(false)
  }),
  
  // 实现处理函数
  handler: async ({ name, formal }) => {
    const message = formal
      ? `尊敬的 ${name}，您好！`
      : `嗨，${name}！`;
    
    return { message };
  }
});

// 创建服务器
const server = createServer({
  name: 'my-first-mcp-server',
  version: '1.0.0',
  tools: [greetingTool]
});

// 启动服务器
server.start(3000).then(() => {
  console.log('服务器已启动: http://localhost:3000/api/metadata');
});
```

### 使用客户端

使用客户端调用服务器工具：

```javascript
const { v3 } = require('mcpm');
const { MCPClient } = v3.client;

// 创建客户端
const client = new MCPClient({
  server: 'http://localhost:3000'
});

// 使用工具代理调用
async function main() {
  // 调用问候工具
  const result = await client.tools.greeting({
    name: '世界',
    formal: true
  });
  
  console.log(result.message);
  // 输出: "尊敬的 世界，您好！"
  
  client.close();
}

main().catch(console.error);
```

### 使用命令行

MCPM 3.0 提供了增强的命令行工具：

```bash
# 创建新项目
mcpm create my-project --v3

# 安装服务
mcpm install text-processor

# 搜索服务
mcpm search "翻译"

# 管理注册表
mcpm registry add custom http://my-registry.com
mcpm registry list
mcpm registry default custom
```

## 核心 API

### 客户端 API

MCPClient 是 MCPM 3.0 的核心客户端类，提供了简单而强大的接口来调用 MCP 服务：

```typescript
import { MCPClient } from 'mcpm/v3/client';

// 创建客户端
const client = new MCPClient({
  // 配置选项
  server?: string;          // 服务器URL
  registry?: string;        // 注册表URL
  credentials?: string;     // 认证凭据
  autoDiscovery?: boolean;  // 自动发现服务
  cacheStrategy?: 'none' | 'memory' | 'persistent';
  cacheTTL?: number;        // 缓存TTL (毫秒)
  timeout?: number;         // 请求超时 (毫秒)
  retry?: {                 // 重试配置
    maxRetries?: number;
    delay?: number;
    factor?: number;
  };
  debug?: boolean;          // 调试模式
});

// 连接到服务器
const metadata = await client.connect();

// 使用工具代理
const result = await client.tools.toolName(params);

// 直接调用工具
const result = await client.callTool('toolName', params);

// 清除缓存
client.clearCache();

// 关闭客户端
client.close();
```

### 服务器 API

服务器 API 提供了声明式的方式来创建和管理 MCP 服务器：

```typescript
import { defineTool, createServer } from 'mcpm/v3/server';
import { z } from 'zod';

// 定义工具
const myTool = defineTool({
  name: string;             // 工具名称
  description: string;      // 工具描述
  input: z.ZodObject;       // 输入架构 (Zod)
  output?: z.ZodType;       // 输出架构 (可选)
  middlewares?: Function[]; // 中间件 (可选)
  handler: Function;        // 处理函数
});

// 创建服务器
const server = createServer({
  name: string;             // 服务器名称
  version: string;          // 服务器版本
  description?: string;     // 服务器描述
  tools: Array;             // 工具列表
  middlewares?: Function[]; // 全局中间件
  security?: Object;        // 安全配置
  storage?: Object;         // 存储配置
  logging?: Object;         // 日志配置
  customRoutes?: Array;     // 自定义路由
});

// 启动服务器
await server.start(3000);

// 添加工具
server.addTool(anotherTool);

// 停止服务器
await server.stop();
```

### 注册表 API

注册表 API 提供了统一的界面来管理和访问多个 MCP 注册表：

```typescript
import { FederatedRegistry, RemoteRegistry } from 'mcpm/v3/registry';

// 创建联合注册表
const registry = new FederatedRegistry({
  caching?: boolean;        // 启用缓存
  parallelSearch?: boolean; // 并行搜索
  defaultLimit?: number;    // 默认限制
  timeout?: number;         // 超时 (毫秒)
});

// 添加注册表源
registry.addSource('mcpm', new RemoteRegistry({
  url: 'https://registry.mcpm.io',
  priority: 1               // 优先级 (较小值优先)
}));

registry.addSource('custom', new RemoteRegistry({
  url: 'https://my-registry.com',
  priority: 2
}));

// 搜索服务
const results = await registry.search({
  query?: string;           // 搜索查询
  tags?: string[];          // 标签过滤
  limit?: number;           // 结果限制
  offset?: number;          // 结果偏移
  sort?: string;            // 排序字段
  order?: 'asc' | 'desc';   // 排序顺序
});

// 获取服务详情
const service = await registry.getService('service-id');

// 安装服务
await registry.install('service-id', './target-directory');

// 设置默认源
registry.setDefaultSource('custom');

// 清除缓存
registry.clearCache();
```

## 高级功能

### 中间件

MCPM 3.0 在服务器和工具级别都支持中间件，用于实现横切关注点和通用功能：

```javascript
// 全局中间件
const loggingMiddleware = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  await next();
  console.log(`[${new Date().toISOString()}] 完成，状态码: ${res.statusCode}`);
};

// 工具级中间件
const toolMiddleware = async (ctx, next) => {
  console.log(`调用工具: ${ctx.toolName}`);
  await next();
  console.log(`工具调用完成: ${ctx.toolName}`);
};

// 使用中间件
const server = createServer({
  middlewares: [loggingMiddleware],
  tools: [
    defineTool({
      name: 'example',
      input: z.object({}),
      middlewares: [toolMiddleware],
      handler: async () => ({ result: 'success' })
    })
  ]
});
```

### 自定义路由

可以为服务器添加自定义路由以处理特殊需求：

```javascript
const server = createServer({
  // ...
  customRoutes: [
    {
      path: '/health',
      method: 'get',
      handler: async (req, res) => {
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      }
    }
  ]
});
```

### 安全配置

MCPM 3.0 提供了全面的安全配置选项：

```javascript
const server = createServer({
  // ...
  security: {
    authenticationTypes: ['none', 'api_key', 'oauth2'],
    
    apiKey: {
      headerName: 'X-API-Key',
      queryParamName: 'api_key',
      keys: [
        { key: 'my-api-key', role: 'admin' }
      ]
    },
    
    oauth2: {
      jwksUrl: 'https://example.auth0.com/.well-known/jwks.json',
      audience: 'https://api.example.com',
      issuer: 'https://example.auth0.com/'
    },
    
    protectedRoutes: ['/api/tools/sensitive-tool'],
    
    rateLimit: {
      limit: 100,      // 请求次数
      period: 60,      // 时间段（秒）
      trustProxy: true // 信任代理头部
    },
    
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS']
    }
  }
});
```

## 向后兼容性

MCPM 3.0 设计为与现有代码和命令完全兼容：

```javascript
// 旧版导入
const mcpm = require('mcpm');

// 新版导入
const { v3 } = require('mcpm');

// 两者都可以工作，但新版提供额外功能
```

## CLI 命令

MCPM 3.0 添加了新的 CLI 命令，同时保留所有现有命令：

| 命令                  | 描述                              |
|-----------------------|----------------------------------|
| `mcpm create <name>`  | 创建新的 MCP 项目                 |
| `mcpm install <name>` | 安装 MCP 服务                    |
| `mcpm search <query>` | 搜索 MCP 服务                    |
| `mcpm registry list`  | 列出所有注册表源                  |
| `mcpm registry add`   | 添加注册表源                      |
| `mcpm registry default` | 设置默认注册表源                |

## 示例

更多示例可以在 [examples/v3](../../examples/v3) 目录中找到：

- [simple-server.js](../../examples/v3/simple-server.js): 简单的声明式服务器示例
- [simple-client.js](../../examples/v3/simple-client.js): 简单的客户端示例
- [advanced-server.js](../../examples/v3/advanced-server.js): 高级服务器示例，展示中间件和安全配置
- [advanced-client.js](../../examples/v3/advanced-client.js): 高级客户端示例，展示工具代理和缓存管理

## 贡献

欢迎贡献代码、文档改进和错误报告。请提交 Pull Request 或创建 Issue 来参与项目的改进。

## 许可证

MIT 