# MCPM 命令行工具文档

欢迎使用 MCPM（MCP Manager）命令行工具！本文档提供了关于MCPM工具的全面指南，包括安装、基本用法、高级功能以及各命令的详细说明。

## 简介

MCPM 是一个功能强大的命令行工具，用于管理 MCP（Model Control Protocol）服务器的完整生命周期。它提供了从初始化、脚手架、开发、部署到监控和维护的全套功能，支持多种云服务提供商和部署环境。

## 文档结构

- [快速入门](./getting-started.md) - 安装和基本使用指南
- [命令参考](./commands/README.md) - 所有命令的详细说明和示例
- [服务器开发](./server-development/README.md) - 使用MCPM创建和开发服务器
- [部署指南](./deployment/README.md) - 部署到各种环境和云服务提供商
- [高级用法](./advanced/README.md) - 批量操作、缓存管理等高级功能
- [最佳实践](./best-practices/README.md) - 推荐的工作流程和使用模式
- [配置文件](./configuration.md) - MCPM配置文件的详细说明
- [API集成](./api-integration.md) - 与MCP注册表API集成
- [故障排除](./troubleshooting.md) - 常见问题和解决方案
- [贡献指南](./contributing.md) - 如何为MCPM项目做贡献

## 核心功能概览

MCPM提供以下核心功能：

### 服务器管理
- 搜索和发现服务器
- 安装和卸载服务器
- 更新服务器
- 服务器信息查看

### 项目创建和开发
- 项目初始化
- 项目脚手架
- 开发模板支持

### 部署和运维
- 多云服务部署支持(AWS, GCP, Azure, 阿里云)
- 服务状态监控
- 日志获取和分析
- 备份和恢复

### 高级功能
- 批量操作
- 本地缓存管理
- 多语言支持

## 版本兼容性

本文档适用于MCPM v1.0.0及以上版本。请确保您使用的是最新版本以获取所有功能。

## 获取帮助

如有任何问题或建议，请通过以下方式联系我们：

- 邮件: support@mcpm.io
- 问题跟踪: [GitHub Issues](https://github.com/mcpm/mcpm/issues)
- 社区论坛: [MCPM 社区](https://community.mcpm.io) 