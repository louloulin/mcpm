# scaffold 命令

`scaffold` 命令用于创建新的MCP服务器项目脚手架，支持多种配置选项和部署环境。

## 语法

```bash
mcpm scaffold [选项]
```

## 选项

| 选项 | 别名 | 描述 | 默认值 |
|------|------|------|--------|
| `--name <name>` | `-n` | 服务器名称 | 交互式提示 |
| `--description <description>` | `-d` | 服务器描述 | 交互式提示 |
| `--author <author>` | `-a` | 作者 | 交互式提示 |
| `--version <version>` | `-v` | 初始版本 | `1.0.0` |
| `--transport <transport>` | `-t` | 传输协议 (stdio, http, both) | `both` |
| `--typescript` | `-ts` | 使用TypeScript | `true` |
| `--install-deps` | `-i` | 自动安装依赖 | `true` |
| `--docker` | - | 添加Docker支持 | `false` |
| `--kubernetes` | - | 添加Kubernetes支持 | `false` |
| `--helm-chart` | - | 创建Helm Chart | `false` |
| `--cloud-provider <provider>` | - | 添加云服务提供商支持 (aws, gcp, azure, alibaba) | `none` |
| `--cicd` | - | 添加CI/CD支持 | `false` |
| `--cicd-platform <platform>` | - | CI/CD平台 (github, gitlab, circleci, jenkins, azure, travis, both, all) | `github` |
| `--port <port>` | `-p` | HTTP服务器端口 | `3000` |
| `--no-prompt` | - | 无交互模式，使用命令行参数和默认值 | `false` |

## 描述

`scaffold` 命令创建一个完整的MCP服务器项目结构，包括所有必要的文件、配置和依赖，支持多种部署环境和云服务提供商。与 `init` 命令相比，`scaffold` 提供了更多的配置选项和更完整的项目结构。

脚手架生成过程包括：
1. 创建项目目录结构
2. 生成基本配置文件（package.json, README.md, .gitignore等）
3. 添加TypeScript配置（如果启用）
4. 创建服务器代码模板
5. 添加Docker支持（如果启用）
6. 添加Kubernetes和Helm配置（如果启用）
7. 添加云服务商特定配置和部署脚本（如果指定）
8. 添加CI/CD配置（如果启用）
9. 安装依赖（如果启用）

## 云服务提供商支持

### AWS

添加以下内容：
- AWS CloudFormation模板
- AWS Lambda部署配置
- ECS服务定义
- S3和DynamoDB资源配置
- 部署脚本

### GCP

添加以下内容：
- Cloud Run部署配置
- Cloud Build CI/CD流程
- Cloud Functions配置
- 部署脚本

### Azure

添加以下内容：
- Azure ARM模板
- App Service配置
- Azure Functions配置
- Azure存储配置
- 部署脚本

### 阿里云

添加以下内容：
- 阿里云ECS配置
- 函数计算配置
- OSS和表格存储配置
- 部署脚本

## CI/CD 支持

支持以下CI/CD平台：
- GitHub Actions
- GitLab CI/CD
- CircleCI
- Jenkins
- Azure DevOps
- Travis CI

## 示例

### 基本用法（交互式）

```bash
mcpm scaffold
```

这将启动交互式向导，指导您完成所有配置选项。

### 创建TypeScript项目

```bash
mcpm scaffold --name my-server --typescript
```

这将创建一个使用TypeScript的MCP服务器项目。

### 包含Docker支持

```bash
mcpm scaffold --name my-server --docker
```

这将创建一个包含Dockerfile和Docker配置的MCP服务器项目。

### AWS部署支持

```bash
mcpm scaffold --name my-server --cloud-provider aws
```

这将创建一个包含AWS部署配置的MCP服务器项目。

### 完整配置

```bash
mcpm scaffold --name my-server \
  --description "我的MCP服务器" \
  --author "张三" \
  --typescript \
  --docker \
  --kubernetes \
  --helm-chart \
  --cloud-provider aws \
  --cicd \
  --cicd-platform github
```

这将创建一个功能齐全的MCP服务器项目，包含TypeScript支持、Docker配置、Kubernetes部署、AWS云服务配置和GitHub Actions CI/CD。

### 无交互模式

```bash
mcpm scaffold --name my-server --no-prompt
```

这将使用指定的参数和默认值创建MCP服务器项目，而不显示交互式提示。

## 目录结构

生成的项目结构如下：

```
my-server/
├── src/
│   ├── index.ts         # 主入口点
│   ├── tools/           # 工具实现
│   └── utils/           # 工具函数
├── test/                # 测试文件
├── config/              # 配置文件
├── docker/              # Docker配置（如启用）
├── kubernetes/          # Kubernetes配置（如启用）
├── helm/                # Helm Chart（如启用）
├── [aws|gcp|azure|alibaba]/ # 云提供商配置（如指定）
├── .github/workflows/   # GitHub Actions（如启用）
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript配置（如启用）
├── Dockerfile           # Docker构建文件（如启用）
└── README.md            # 项目说明
```

## 相关命令

- [init](./init.md) - 初始化一个基本的MCP服务器项目
- [deploy](./deploy.md) - 部署MCP服务器到云提供商 