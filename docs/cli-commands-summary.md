# MCP CLI命令总结

## 已实现命令

### 脚手架命令 (`scaffold`)

用于创建新的MCP服务器项目脚手架，支持多种配置选项。

**核心功能**:
- 创建完整的项目结构
- 支持多种云服务商 (AWS, GCP, Azure, Alibaba)
- 生成配置文件和Dockerfile
- 支持Kubernetes和Helm Chart配置
- 支持CI/CD工作流配置

### 部署命令 (`deploy`)

用于将MCP服务器部署到各种云服务商，自动检测和处理环境配置。

**核心功能**:
- 自动检测项目配置的云服务商
- 验证必要的环境变量
- 交互式选择部署环境
- 支持AWS、GCP、Azure和阿里云

### 状态命令 (`status`)

用于检查已部署的MCP服务器的状态和健康情况。

**核心功能**:
- 通过URL直接检查远程服务器
- 自动检测项目配置的云服务商
- 提供详细的服务器状态信息
- 支持JSON格式输出

### 日志命令 (`logs`)

用于获取已部署的MCP服务器的日志信息。

**核心功能**:
- 获取不同云服务商的服务器日志
- 支持实时日志跟踪（类似tail -f）
- 提供日志过滤功能（时间和内容）
- 支持JSON格式输出

**云服务商特定实现**:
- **AWS**: 
  - 支持从CloudWatch Logs获取Lambda和ECS服务的日志
  - 自动检测部署的资源类型（Lambda或ECS）
  - 支持实时日志流和历史日志检索
- **GCP**:
  - 从Cloud Logging获取日志信息
  - 支持高级过滤表达式
  - 提供按时间和严重程度过滤选项
- **Azure**:
  - 从Azure App Service日志系统获取日志
  - 支持日志下载和流式传输
  - 提供资源组自动检测
- **阿里云**:
  - 从本地日志文件获取日志信息
  - 支持本地日志文件的实时跟踪
  - 提供按内容过滤选项

**高级选项**:
- `-t, --tail`: 实时跟踪日志更新
- `-n, --limit <number>`: 限制获取的日志行数
- `-s, --since <time>`: 指定时间段获取日志（如 30m、1h、2d）
- `-g, --grep <pattern>`: 按照模式过滤日志内容
- `--json`: 以JSON格式输出，便于进一步处理

## 命令使用示例

### 创建新项目

```bash
# 基本用法
mcpm scaffold my-server

# 指定云服务商
mcpm scaffold my-server --cloud aws

# 完整配置
mcpm scaffold my-server --description "我的MCP服务器" --author "张三" --cloud aws --typescript --docker --kubernetes
```

### 部署项目

```bash
# 自动检测云服务商并部署
mcpm deploy

# 指定云服务商和环境
mcpm deploy --cloud aws --environment production

# 部署指定路径的项目
mcpm deploy --path /path/to/project
```

### 检查服务器状态

```bash
# 检查当前项目部署的服务器状态
mcpm status

# 通过URL检查远程服务器
mcpm status --url https://my-server.example.com

# 检查特定环境的状态并输出JSON
mcpm status --environment production --json
```

### 获取服务器日志

```bash
# 获取当前项目部署的服务器日志
mcpm logs

# 实时跟踪日志
mcpm logs --tail

# 获取特定时间段的日志并过滤
mcpm logs --since 1h --grep ERROR

# 获取特定环境的日志
mcpm logs --environment production --limit 200
```

## 工具和辅助功能

### 环境变量验证

用于验证云服务商所需的环境变量是否正确配置。

**支持的云服务商**:
- AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- GCP: `GOOGLE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`
- Azure: `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- Alibaba: `ALIBABA_ACCESS_KEY_ID`, `ALIBABA_ACCESS_KEY_SECRET`, `ALIBABA_REGION` 