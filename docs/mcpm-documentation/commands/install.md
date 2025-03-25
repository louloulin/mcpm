# install 命令

`install` 命令用于从MCP注册表安装服务器到本地或指定位置。

## 语法

```bash
mcpm install <key> [选项]
```

别名: `i`

## 参数

| 参数 | 描述 |
|------|------|
| `key` | **必填**。MCP服务器的标识符，用于在注册表中查找服务器 |

## 选项

| 选项 | 别名 | 描述 | 默认值 |
|------|------|------|--------|
| `--path <path>` | `-p` | 指定安装路径 | 当前目录下的`.mcpm/servers` |
| `--global` | `-g` | 安装到全局路径 | `false` |
| `--force` | `-f` | 强制重新安装 | `false` |
| `--version <version>` | `-v` | 指定要安装的版本 | 最新版本 |

## 描述

`install` 命令从MCP注册表下载并安装指定的服务器。默认情况下，服务器安装到本地目录，但可以使用`--global`选项安装到全局位置，使其对所有项目可用。

安装过程包括：
1. 从注册表获取服务器信息
2. 下载服务器文件
3. 安装到指定位置
4. 记录下载统计信息
5. 显示使用说明

如果服务器已经安装，除非使用`--force`选项，否则命令将不会重新安装。

## 示例

### 基本安装

```bash
mcpm install postgres
```

这将安装最新版本的postgres服务器到当前目录下的`.mcpm/servers`。

### 安装特定版本

```bash
mcpm install postgres --version 14.2.0
```

这将安装postgres服务器的14.2.0版本。

### 全局安装

```bash
mcpm install postgres --global
```

这将安装postgres服务器到全局位置（通常是`~/.mcpm/servers`）。

### 强制重新安装

```bash
mcpm install postgres --force
```

这将强制重新安装postgres服务器，即使它已经安装。

### 安装到指定路径

```bash
mcpm install postgres --path ./custom-servers
```

这将安装postgres服务器到`./custom-servers`目录。

## 输出

成功安装后，命令将显示：
- 安装的服务器名称和版本
- 服务器需要的环境变量配置指南
- 运行服务器的命令
- 查看更多信息的命令

## 相关命令

- [interactive-install](./interactive-install.md) - 交互式安装服务器
- [uninstall](./uninstall.md) - 卸载服务器
- [update](./update.md) - 更新已安装的服务器
- [list](./list.md) - 列出已安装的服务器
- [info](./info.md) - 查看服务器信息 