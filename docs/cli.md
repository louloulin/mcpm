# MCP CLI功能文档

MCP CLI是一个命令行工具，用于管理MCP服务器。本文档介绍了CLI的增强功能，包括交互式安装、服务器初始化、批量操作和缓存管理。

## 安装

```bash
npm install -g mcpm
```

## 命令概览

以下是主要命令的简要说明：

| 命令 | 描述 |
|------|------|
| `mcpm search <关键词>` | 搜索服务器 |
| `mcpm info <服务器>` | 查看服务器信息 |
| `mcpm install <服务器>` | 安装服务器 |
| `mcpm ii` | 交互式安装服务器 |
| `mcpm init` | 初始化一个新的MCP服务器项目 |
| `mcpm bulk <规范文件>` | 批量执行服务器操作 |
| `mcpm cache` | 管理本地缓存 |
| `mcpm update` | 更新已安装的服务器 |
| `mcpm uninstall <服务器>` | 卸载服务器 |
| `mcpm list` | 列出已安装的服务器 |
| `mcpm sync` | 同步服务器列表 |
| `mcpm config` | 管理配置 |
| `mcpm login` | 登录到MCP注册表 |
| `mcpm logout` | 从MCP注册表登出 |
| `mcpm publish` | 发布服务器到MCP注册表 |

## 增强功能详解

### 交互式安装 (`mcpm ii`)

交互式安装提供了一个友好的命令行界面，引导用户完成MCP服务器的安装过程：

```bash
mcpm ii
```

选项：
- `-p, --path <path>` - 指定安装路径
- `-g, --global` - 全局安装

功能：
1. 从注册表获取可用服务器列表
2. 允许用户交互式选择服务器
3. 提供版本选择（最新或特定版本）
4. 配置环境变量
5. 显示安装状态和结果
6. 提供运行选项

### 服务器初始化 (`mcpm init`)

初始化命令可以快速创建一个新的MCP服务器项目：

```bash
mcpm init
```

选项：
- `-d, --dir <目录>` - 项目目录
- `-t, --template <模板>` - 模板类型

支持的模板：
- `basic` - 基础服务器
- `tool` - 工具服务器
- `agent` - 代理服务器
- `function` - 函数服务器
- `custom` - TypeScript服务器

功能：
1. 创建项目目录结构
2. 生成必要的配置文件
3. 创建初始代码和示例
4. 根据选定模板添加相应的依赖

### 批量操作 (`mcpm bulk`)

批量操作命令允许通过规范文件同时对多个服务器执行操作：

```bash
mcpm bulk <规范文件>
```

选项：
- `-i, --interactive` - 交互式确认每个操作

生成规范文件模板：
```bash
mcpm bulk-template -o bulk-spec.json -t install
```

规范文件格式：
```json
{
  "servers": ["server1", "server2"],
  "operation": "install",
  "installPath": "./servers",
  "version": {
    "server1": "1.0.0"
  }
}
```

支持的操作：
- `install` - 安装服务器
- `update` - 更新服务器
- `uninstall` - 卸载服务器

### 缓存管理 (`mcpm cache`)

缓存管理命令用于优化本地缓存，提高性能：

```bash
mcpm cache <子命令>
```

子命令：
- `info` - 显示缓存信息
- `list` - 列出缓存内容
  - `-t, --type <类型>` - 缓存类型 (servers, assets, metadata, temp)
  - `-p, --pattern <模式>` - 搜索模式
  - `-l, --limit <限制>` - 限制结果数
- `clean` - 清理缓存
  - `-t, --type <类型>` - 缓存类型
  - `-p, --pattern <模式>` - 文件匹配模式
  - `-d, --days <天数>` - 清理多少天前的缓存
  - `-f, --force` - 跳过确认
- `config` - 配置缓存目录
  - `-d, --dir <目录>` - 设置缓存目录
  - `-s, --show` - 显示当前缓存配置
  - `-r, --reset` - 重置为默认缓存目录

## 配置文件

CLI使用`~/.mcpmrc`配置文件存储设置，支持以下配置：

```yaml
registry:
  url: https://registry.mcpm.io
  token: your-token
client:
  type: claude
  configPath: /path/to/config.json
servers:
  installPath: ~/.mcpm/servers
  autoUpdate: true
cache:
  dir: ~/.mcpm/cache
  sizeLimit: 500
```

## 快速入门示例

### 交互式安装服务器

```bash
# 启动交互式安装向导
mcpm ii
```

### 创建新服务器项目

```bash
# 创建一个新的工具服务器
mcpm init -d my-tool-server -t tool
cd my-tool-server
npm install
npm start
```

### 批量安装服务器

```bash
# 生成规范模板
mcpm bulk-template -o servers.json -t install

# 编辑规范文件后批量安装
mcpm bulk servers.json
```

### 管理缓存

```bash
# 查看缓存信息
mcpm cache info

# 清理7天前的临时缓存
mcpm cache clean -t temp -d 7

# 更改缓存目录
mcpm cache config -d /path/to/new/cache
``` 