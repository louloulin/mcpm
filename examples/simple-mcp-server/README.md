# MCP 文本处理服务器示例

这是一个基于MCP (Model Context Protocol) 框架的简单文本处理服务器示例，展示如何创建、实现和注册MCP服务。

## 功能特点

该示例MCP服务器提供三种文本处理功能:

1. **文本摘要** - 将长文本总结为简短的摘要
2. **文本翻译** - 将文本从一种语言翻译为另一种语言
3. **文本分析** - 分析文本的情感、关键词和主题

## 目录结构

```
simple-mcp-server/
├── server-definition.ts   # MCP服务器定义
├── server-implementation.ts # MCP服务器实现
├── client-usage.ts        # 客户端使用示例
├── register-with-mcpm.ts  # MCPM注册示例
└── README.md              # 说明文档
```

## 快速开始

### 安装依赖

确保你已安装项目依赖:

```bash
pnpm install
```

### 运行服务器

启动MCP文本处理服务器:

```bash
npx ts-node examples/simple-mcp-server/server-implementation.ts
```

服务器将在端口3100上运行。

### 客户端使用

运行客户端示例:

```bash
npx ts-node examples/simple-mcp-server/client-usage.ts
```

这将展示如何使用MCP服务器的三个主要功能。

### 注册到MCPM

演示如何将MCP服务器注册到MCPM系统:

```bash
npx ts-node examples/simple-mcp-server/register-with-mcpm.ts
```

## API参考

### 1. 文本摘要

**端点:** `/api/mcp/text-processor/summarize`

**请求参数:**
- `text` (string): 需要被总结的文本内容 (最少50个字符)
- `maxLength` (number, 可选): 摘要的最大长度，默认100

**响应示例:**
```json
{
  "jsonrpc": "2.0",
  "id": "abcd123",
  "result": {
    "summary": "摘要内容...",
    "originalLength": 1024,
    "summaryLength": 256
  }
}
```

### 2. 文本翻译

**端点:** `/api/mcp/text-processor/translate`

**请求参数:**
- `text` (string): 需要翻译的文本
- `sourceLanguage` (string, 可选): 源语言代码，默认"auto"
- `targetLanguage` (string): 目标语言代码

**响应示例:**
```json
{
  "jsonrpc": "2.0",
  "id": "abcd123",
  "result": {
    "translation": "翻译后的文本...",
    "sourceLanguage": "zh",
    "targetLanguage": "en"
  }
}
```

### 3. 文本分析

**端点:** `/api/mcp/text-processor/analyze`

**请求参数:**
- `text` (string): 需要分析的文本
- `analysisTypes` (string[], 可选): 分析类型，可选值: "sentiment", "keywords", "topics"

**响应示例:**
```json
{
  "jsonrpc": "2.0",
  "id": "abcd123",
  "result": {
    "sentiment": {
      "score": 2,
      "label": "positive"
    },
    "keywords": [
      { "word": "artificial", "count": 3 },
      { "word": "intelligence", "count": 2 }
    ]
  }
}
```

## 认证

所有API请求需要使用API密钥进行认证。在请求头中添加:

```
X-API-Key: demo-api-key
```

## 与MCPM集成

该示例演示了MCP服务器如何与MCPM系统集成:

1. 创建符合MCP规范的服务器定义
2. 实现服务器功能
3. 使用密钥对服务器定义进行签名
4. 将服务器注册到MCPM注册表
5. 验证服务器健康状态

## 扩展

可以通过以下方式扩展此示例:

1. 添加更多文本处理功能
2. 集成真实的AI/NLP服务
3. 添加数据持久化
4. 实现更复杂的权限管理 