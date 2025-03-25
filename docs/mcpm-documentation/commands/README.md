# MCPM 命令参考

本文档提供了所有MCPM命令的详细参考信息。命令按功能分组，方便查找。

## 命令概览

下表列出了MCPM的所有命令及其简要说明：

| 命令 | 别名 | 描述 |
|------|------|------|
| `mcpm search <关键词>` | - | 搜索服务器 |
| `mcpm info <服务器>` | - | 查看服务器信息 |
| `mcpm install <服务器>` | `i` | 安装服务器 |
| `mcpm interactive-install` | `ii` | 交互式安装服务器 |
| `mcpm uninstall <服务器>` | - | 卸载服务器 |
| `mcpm update` | - | 更新已安装的服务器 |
| `mcpm list` | `ls` | 列出已安装的服务器 |
| `mcpm sync` | - | 同步服务器列表 |
| `mcpm init` | - | 初始化一个新的MCP服务器项目 |
| `mcpm scaffold` | - | 创建新的MCP服务器项目脚手架 |
| `mcpm deploy` | - | 部署MCP服务器到云提供商 |
| `mcpm status` | - | 检查已部署MCP服务器的状态 |
| `mcpm logs` | - | 获取已部署MCP服务器的日志 |
| `mcpm backup` | - | 创建已部署MCP服务器的备份 |
| `mcpm restore` | - | 从备份恢复MCP服务器 |
| `mcpm bulk <规范文件>` | - | 批量执行服务器操作 |
| `mcpm bulk-template` | - | 生成批量操作规范文件模板 |
| `mcpm cache` | - | 管理本地缓存 |
| `mcpm config` | - | 管理配置 |
| `mcpm login` | - | 登录到MCP注册表 |
| `mcpm logout` | - | 从MCP注册表登出 |
| `mcpm publish` | - | 发布服务器到MCP注册表 |
| `mcpm language` | - | 更改CLI语言设置 |
| `mcpm docs` | - | API文档生成和管理工具 |

## 命令分类

### 服务器管理命令

这些命令用于管理MCP服务器的安装、更新和使用：

- [search](./search.md) - 搜索服务器
- [info](./info.md) - 查看服务器信息
- [install](./install.md) - 安装服务器
- [interactive-install](./interactive-install.md) - 交互式安装服务器
- [uninstall](./uninstall.md) - 卸载服务器
- [update](./update.md) - 更新已安装的服务器
- [list](./list.md) - 列出已安装的服务器
- [sync](./sync.md) - 同步服务器列表

### 项目创建和开发命令

这些命令用于创建和开发新的MCP服务器项目：

- [init](./init.md) - 初始化一个新的MCP服务器项目
- [scaffold](./scaffold.md) - 创建新的MCP服务器项目脚手架

### 部署和运维命令

这些命令用于部署、监控和维护MCP服务器：

- [deploy](./deploy.md) - 部署MCP服务器到云提供商
- [status](./status.md) - 检查已部署MCP服务器的状态
- [logs](./logs.md) - 获取已部署MCP服务器的日志
- [backup](./backup.md) - 创建已部署MCP服务器的备份
- [restore](./restore.md) - 从备份恢复MCP服务器

### 批量操作命令

这些命令用于批量执行服务器操作：

- [bulk](./bulk.md) - 批量执行服务器操作
- [bulk-template](./bulk-template.md) - 生成批量操作规范文件模板

### 缓存和配置命令

这些命令用于管理MCPM的缓存和配置：

- [cache](./cache.md) - 管理本地缓存
- [config](./config.md) - 管理配置

### 注册表命令

这些命令用于与MCP注册表交互：

- [login](./login.md) - 登录到MCP注册表
- [logout](./logout.md) - 从MCP注册表登出
- [publish](./publish.md) - 发布服务器到MCP注册表

### 其他命令

其他实用命令：

- [language](./language.md) - 更改CLI语言设置
- [docs](./docs.md) - API文档生成和管理工具

## 通用选项

以下选项适用于大多数MCPM命令：

- `-h, --help` - 显示命令帮助
- `-v, --version` - 显示MCPM版本
- `--json` - 以JSON格式输出结果

## 命令使用示例

每个命令的详细页面都提供了具体的使用示例。以下是一些常见命令的使用示例：

```bash
# 搜索服务器
mcpm search postgres

# 安装服务器
mcpm install postgres

# 交互式安装
mcpm ii

# 初始化项目
mcpm init -d my-server -t basic

# 创建脚手架项目
mcpm scaffold -n my-server --typescript --docker

# 部署到AWS
mcpm deploy --cloud aws --environment production

# 查看状态
mcpm status

# 获取日志
mcpm logs --tail
```

## 下一步

- 查看[服务器开发指南](../server-development/README.md)了解如何使用MCPM创建和开发MCP服务器
- 阅读[部署指南](../deployment/README.md)学习如何部署到不同的环境和云服务提供商
- 探索[高级用法](../advanced/README.md)掌握MCPM的高级功能 