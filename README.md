# MCP服务器仓库

基于Glama的MCP（Model Context Protocol）实施，构建一个类似npm的MCP服务器仓库，允许用户发现、安装和使用各种MCP服务器。

## 项目概述

MCP（Model Context Protocol）是由Anthropic开发的协议，允许LLM（大型语言模型）与外部工具和数据源进行交互。当前，MCP服务器的分发和发现机制尚不完善，需要一个中心化的仓库来简化这一过程，类似于npm对JavaScript包的管理方式。

本项目实现了一个完整的MCP服务器仓库系统，包括：

- 中央Registry服务，提供服务器的注册、查询和检索功能
- CLI工具，用于发现、安装和管理MCP服务器
- Web界面，提供服务器浏览和搜索功能
- 同步引擎，与Glama平台自动同步

## 功能特点

- **服务器发现**：通过搜索、标签过滤等方式快速查找需要的MCP服务器
- **一键安装**：简单的命令即可安装并配置MCP服务器
- **版本管理**：支持服务器的安装、更新和卸载
- **自动同步**：定期与Glama平台同步，确保服务器信息最新
- **用户管理**：提供账户系统和权限控制
- **服务器评分**：允许用户对服务器进行评分和评论

## 快速开始

### 安装CLI工具

```bash
npm install -g mcpm
```

### 搜索服务器

```bash
mcpm search postgres
```

### 安装服务器

```bash
mcpm install Postgres
```

### 查看服务器详情

```bash
mcpm info Postgres
```

### 更新服务器

```bash
mcpm update
```

## 命令参考

| 命令 | 描述 |
| --- | --- |
| `search` | 搜索MCP服务器 |
| `install` | 安装MCP服务器 |
| `uninstall` | 卸载MCP服务器 |
| `update` | 更新MCP服务器 |
| `list` | 列出已安装服务器 |
| `info` | 显示服务器详情 |
| `sync` | 同步仓库 |
| `config` | 配置CLI工具 |
| `login` | 用户登录 |
| `logout` | 用户退出 |

## 开发指南

### 环境要求

- Node.js 16+
- npm 7+

### 安装依赖

```bash
npm install
```

### 运行开发环境

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

## 贡献指南

欢迎贡献代码、提交问题或改进建议！请参阅[贡献指南](CONTRIBUTING.md)。

## 许可证

MIT
