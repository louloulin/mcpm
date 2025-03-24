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

**云服务商特定实现**:
- **AWS**: 
  - 生成AWS CloudFormation模板
  - 配置AWS Lambda和ECS部署脚本
  - 设置S3和DynamoDB资源
- **GCP**:
  - 生成Cloud Run部署配置
  - 设置Cloud Build CI/CD流程
  - 配置Cloud Functions入口点
  - 创建自动化部署脚本(deploy.sh)，支持环境参数
  - 包含详细的GCP资源管理文档
- **Azure**:
  - 生成Azure ARM模板
  - 配置App Service和Azure Functions部署
  - 设置Azure存储和SQL资源
- **阿里云**:
  - 配置阿里云ECS和函数计算部署
  - 设置OSS和表格存储资源

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

### 更新命令 (`update`)

用于将已部署的MCP服务器更新到较新的版本。

**核心功能**:
- 自动检测项目配置的云服务商
- 检查可用的更新版本
- 创建部署前的自动备份
- 支持失败时的自动回滚

**云服务商特定实现**:
- **AWS**:
  - 支持Lambda和ECS服务的更新
  - 更新版本号信息和部署脚本
  - 集成AWS的蓝/绿部署策略
- **GCP**:
  - 支持Google Cloud Run和GKE的更新
  - 自动处理容器版本标记
  - 管理Cloud Build集成
- **Azure**:
  - 更新Azure App Service和Azure Functions
  - 支持部署槽位交换(slot swapping)
  - 管理Azure资源锁定
- **阿里云**:
  - 支持阿里云ECS和函数计算的更新
  - 管理容器镜像版本
  - 处理阿里云资源更新

**高级选项**:
- `-c, --cloud <provider>`: 指定云服务商
- `-e, --environment <environment>`: 指定部署环境
- `-v, --version <version>`: 指定目标版本
- `--check-only`: 仅检查更新而不应用
- `--force`: 强制更新即使存在破坏性变更
- `--keep-data`: 在更新过程中保留数据
- `--no-backup`: 跳过更新前的自动备份
- `--rollback-on-failure`: 更新失败时自动回滚
- `--json`: 以JSON格式输出，便于进一步处理

### 备份命令 (`backup`)

用于创建已部署的MCP服务器的备份，支持多种备份类型和选项。

**核心功能**:
- 自动检测项目配置的云服务商
- 创建数据库和文件系统的备份
- 支持完整服务器快照
- 灵活的备份范围控制选项

**云服务商特定实现**:
- **AWS**:
  - 支持RDS数据库快照创建
  - 集成S3桶备份功能
  - 提供EC2/ECS快照管理
- **GCP**:
  - 支持Cloud SQL备份
  - 管理Cloud Storage文件备份
  - 提供Compute Engine快照功能
- **Azure**:
  - 集成Azure SQL备份系统
  - 支持Azure Blob Storage备份
  - 管理VM快照和镜像备份
- **阿里云**:
  - 支持阿里云ApsaraDB备份
  - 管理OSS备份功能
  - 提供ECS实例和镜像备份

**高级选项**:
- `-c, --cloud <provider>`: 指定云服务商
- `-e, --environment <environment>`: 指定部署环境
- `-d, --description <description>`: 备份描述信息
- `-f, --full`: 创建完整备份（包括所有资源）
- `--no-database`: 跳过数据库备份
- `--no-files`: 跳过文件存储备份
- `--retention <days>`: 保留此备份的天数（默认30天）
- `--json`: 以JSON格式输出，便于进一步处理

### 恢复命令 (`restore`)

用于从备份中恢复MCP服务器，支持选择性恢复和多种恢复选项。

**核心功能**:
- 自动检测项目配置的云服务商
- 显示和选择可用备份列表
- 支持选择最新备份自动恢复
- 可选择性恢复数据库或文件系统

**云服务商特定实现**:
- **AWS**:
  - 支持从RDS快照恢复数据库
  - 从S3备份恢复文件数据
  - 提供EC2/ECS实例恢复功能
- **GCP**:
  - 支持从Cloud SQL备份恢复
  - 从Cloud Storage恢复文件数据
  - 恢复Compute Engine资源
- **Azure**:
  - 从Azure SQL备份恢复数据库
  - 从Blob Storage备份恢复文件
  - 提供VM和资源恢复功能
- **阿里云**:
  - 从ApsaraDB备份恢复数据库
  - 从OSS备份恢复文件数据
  - 提供ECS实例恢复功能

**高级选项**:
- `-c, --cloud <provider>`: 指定云服务商
- `-e, --environment <environment>`: 指定部署环境
- `-b, --backup <backupName>`: 指定要恢复的备份名称
- `-l, --latest`: 使用最新的备份恢复
- `--database-only`: 仅恢复数据库
- `--files-only`: 仅恢复文件存储
- `--confirm`: 跳过确认提示
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

### 更新服务器

```bash
# 检查当前项目部署的服务器是否有更新
mcpm update --check-only

# 更新到最新版本
mcpm update

# 更新到特定版本并跳过备份
mcpm update --version 1.2.0 --no-backup

# 强制更新并在失败时回滚
mcpm update --force --rollback-on-failure
```

### 备份服务器

```bash
# 创建基本备份
mcpm backup

# 创建完整备份（包括计算资源）
mcpm backup --full

# 仅备份文件系统，跳过数据库
mcpm backup --no-database

# 带描述信息的特定环境备份
mcpm backup --environment production --description "发布前备份" --retention 90
```

### 恢复服务器

```bash
# 交互式选择备份进行恢复
mcpm restore

# 从最新备份恢复
mcpm restore --latest

# 从指定备份恢复
mcpm restore --backup backup_production_2023_01_01T00_00_00_000Z

# 仅恢复数据库
mcpm restore --latest --database-only

# 恢复到特定环境并跳过确认
mcpm restore --environment staging --latest --confirm
```

## 工具和辅助功能

### 环境变量验证

用于验证云服务商所需的环境变量是否正确配置。

**支持的云服务商**:
- AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- GCP: `GOOGLE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`
- Azure: `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- Alibaba: `ALIBABA_ACCESS_KEY_ID`, `ALIBABA_ACCESS_KEY_SECRET`, `ALIBABA_REGION` 