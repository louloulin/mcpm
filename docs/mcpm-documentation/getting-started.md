# MCPM 快速入门指南

本指南将帮助您安装MCPM命令行工具并开始使用其基本功能。

## 安装

### 全局安装

要全局安装MCPM，请使用npm或pnpm：

```bash
# 使用npm
npm install -g mcpm

# 使用pnpm
pnpm add -g mcpm
```

安装完成后，您可以在任何目录中使用`mcpm`命令。

### 验证安装

安装完成后，运行以下命令验证MCPM是否正确安装：

```bash
mcpm --version
```

您应该看到当前安装的MCPM版本号。

## 基本使用

### 获取帮助

要查看所有可用命令和选项，请运行：

```bash
mcpm --help
```

要查看特定命令的帮助信息，请运行：

```bash
mcpm <命令> --help
```

例如：

```bash
mcpm init --help
```

### 配置

首次使用前，可以配置MCPM的基本设置：

```bash
mcpm config
```

这将指导您完成配置过程，包括：

- 设置注册表URL
- 配置默认安装路径
- 设置缓存目录
- 选择语言

您也可以直接设置特定配置项：

```bash
mcpm config set registry.url https://registry.mcpm.io
```

### 登录注册表

如果您需要访问私有服务器或发布自己的服务器，需要登录到MCP注册表：

```bash
mcpm login
```

## 常用操作流程

### 搜索和安装服务器

1. 搜索服务器：

```bash
mcpm search <关键词>
```

2. 查看服务器详情：

```bash
mcpm info <服务器名称>
```

3. 安装服务器：

```bash
mcpm install <服务器名称>
```

或使用交互式安装向导：

```bash
mcpm ii
```

### 创建新服务器项目

1. 初始化基本项目：

```bash
mcpm init -d my-server -t basic
```

2. 创建高级项目（带脚手架）：

```bash
mcpm scaffold -n my-server --typescript --docker
```

### 部署服务器

1. 部署到云服务：

```bash
mcpm deploy --cloud aws --environment production
```

2. 检查部署状态：

```bash
mcpm status
```

3. 查看服务器日志：

```bash
mcpm logs --tail
```

## 后续步骤

- 查看[命令参考](./commands/README.md)了解所有命令的详细信息
- 参考[服务器开发指南](./server-development/README.md)学习如何创建和开发MCP服务器
- 阅读[部署指南](./deployment/README.md)了解如何部署到不同的环境和云服务提供商
- 探索[高级用法](./advanced/README.md)掌握MCPM的高级功能

## 故障排除

如果您在安装或使用MCPM时遇到问题，请参阅[故障排除指南](./troubleshooting.md)。 