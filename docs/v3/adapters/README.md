# MCPM 3.0 框架适配器

框架适配器是MCPM 3.0的核心功能之一，它允许开发者轻松地将MCP工具集成到各种AI框架中。通过适配器，您可以在不修改现有代码的情况下，将MCP强大的工具能力无缝引入到您的AI应用中。

## 支持的框架

目前，MCPM 3.0支持以下框架的适配器：

- **LangChain**：用于在LangChain应用中使用MCP工具
- **Mastra**：用于在Mastra应用中使用MCP工具
- **Chainlit**：用于在Chainlit应用中使用MCP工具和可视化工具执行过程

## 适配器工作原理

每个适配器都遵循相同的基本工作流程：

1. **初始化**：创建适配器实例并连接到MCP服务器
2. **工具发现**：自动发现可用的MCP工具
3. **工具包装**：将MCP工具包装为特定框架可识别的格式
4. **工具执行**：在框架内调用MCP工具并处理结果

适配器提供了一致的API，简化了在不同框架之间共享工具的复杂性，同时保留了每个框架的特性和优势。

## 快速开始

### 安装

```bash
npm install mcpm@3
```

### 基本用法

```javascript
// 导入适配器
const { v3 } = require('mcpm');
const { createAdapter } = v3.adapters;

// 创建适配器实例
const adapter = createAdapter('langchain', {
  client: {
    server: 'http://localhost:3100',
    autoDiscovery: true
  },
  debug: true
});

// 初始化适配器
await adapter.init();

// 创建工具
const tools = await adapter.createAllTools();

// 在您的框架中使用工具
// ...

// 不再需要时关闭适配器
await adapter.close();
```

## 适配器API参考

所有适配器都实现了通用的`BaseAdapter`接口，包含以下核心方法：

- `init(options?)`: 初始化适配器并连接到MCP服务器
- `close()`: 关闭适配器并释放资源
- `createTool(options)`: 创建单个工具包装器
- `createAllTools()`: 创建所有可用工具的包装器

## 详细指南

每个适配器都有其特定的功能和配置选项。请查看各适配器的详细文档：

- [LangChain适配器](./langchain.md)
- [Mastra适配器](./mastra.md)
- [Chainlit适配器](./chainlit.md)

## 创建自定义适配器

如果您需要为其他框架创建适配器，MCPM 3.0提供了可扩展的适配器架构。请参考[创建自定义适配器](./custom.md)指南。 