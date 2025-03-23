# MCP Server 脚手架命令

`mcp-server scaffold` 命令用于快速创建和配置新的 MCP 服务器项目。

## 使用方法

```bash
mcp-server scaffold [options]
```

或者使用简写形式：

```bash
mcp-server s [options]
```

## 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--name`, `-n` | 项目名称 | 必填 |
| `--template`, `-t` | 项目模板 (`typescript`, `javascript`) | `typescript` |
| `--port`, `-p` | 服务器监听端口 | `3000` |
| `--docker`, `-d` | 是否添加 Docker 支持 | `false` |
| `--cicd-platform` | CI/CD 平台 (`github`, `gitlab`, `circleci`, `jenkins`, `azure`, `travis`, `none`) | `none` |
| `--cloud-provider` | 云服务提供商 (`aws`, `gcp`, `azure`, `alibaba`, `none`) | `none` |
| `--k8s` | 是否添加 Kubernetes 配置 | `false` |
| `--helm` | 是否添加 Helm Chart 模板 | `false` |
| `--output-dir`, `-o` | 输出目录 | 当前目录 |
| `--install-deps`, `-i` | 是否自动安装依赖 | `false` |
| `--help`, `-h` | 显示帮助信息 | |

## 示例

### 基本示例

```bash
# 创建一个名为 my-server 的基本 TypeScript 服务器
mcp-server scaffold --name my-server
```

### 添加 Docker 支持

```bash
# 创建带有 Docker 支持的服务器
mcp-server scaffold --name my-server --docker
```

### 添加 CI/CD 平台支持

```bash
# 使用 GitHub Actions 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform github

# 使用 GitLab CI 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform gitlab

# 使用 CircleCI 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform circleci

# 使用 Jenkins 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform jenkins

# 使用 Azure DevOps 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform azure

# 使用 Travis CI 作为 CI/CD 平台
mcp-server scaffold --name my-server --cicd-platform travis
```

### 添加云服务提供商支持

```bash
# 添加 AWS 云服务集成
mcp-server scaffold --name my-server --cloud-provider aws

# 添加 Google Cloud Platform 云服务集成
mcp-server scaffold --name my-server --cloud-provider gcp

# 添加 Microsoft Azure 云服务集成
mcp-server scaffold --name my-server --cloud-provider azure

# 添加阿里云服务集成
mcp-server scaffold --name my-server --cloud-provider alibaba
```

### 添加 Kubernetes 和 Helm 支持

```bash
# 创建带有 Kubernetes 配置的服务器
mcp-server scaffold --name my-server --k8s

# 创建带有 Helm Chart 的服务器
mcp-server scaffold --name my-server --helm

# 同时添加 Kubernetes 和 Helm Chart 支持
mcp-server scaffold --name my-server --k8s --helm
```

### 组合选项

```bash
# 创建完整的服务器项目，包含 Docker、GitHub Actions CI/CD、AWS 云服务集成和 Kubernetes 支持
mcp-server scaffold --name my-server --template typescript --port 8080 --docker --cicd-platform github --cloud-provider aws --k8s --install-deps
```

## 生成的文件结构

脚手架命令会创建以下文件结构（以 TypeScript 模板为例）：

```
my-server/
├── .github/                    # GitHub Actions 工作流（如果选择）
├── .gitlab-ci.yml              # GitLab CI 配置（如果选择）
├── .circleci/                  # CircleCI 配置（如果选择）
├── Jenkinsfile                 # Jenkins 配置（如果选择）
├── .travis.yml                 # Travis CI 配置（如果选择）
├── azure-pipelines.yml         # Azure DevOps 配置（如果选择）
├── k8s/                        # Kubernetes 配置（如果选择）
├── helm/                       # Helm Chart 模板（如果选择）
├── aws/                        # AWS 配置文件（如果选择）
│   ├── cloudformation.yml      # CloudFormation 模板
│   ├── sam-template.yml        # SAM 模板
│   ├── lambda.ts               # Lambda 处理程序
│   ├── deploy.sh               # 部署脚本
│   └── README.md               # AWS 部署说明
├── src/
│   ├── index.ts                # 入口文件
│   ├── server.ts               # 服务器定义
│   ├── controllers/            # 控制器
│   ├── models/                 # 数据模型
│   ├── routes/                 # 路由
│   └── utils/                  # 工具函数
├── test/                       # 测试文件
├── Dockerfile                  # Docker 配置（如果选择）
├── docker-compose.yml          # Docker Compose 配置（如果选择）
├── .env.example                # 环境变量示例
├── .gitignore                  # Git 忽略配置
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 项目说明
```

## 环境配置

脚手架生成的项目包含一个 `.env.example` 文件，其中列出了所有可用的环境变量。使用前请将其复制为 `.env` 并根据需要修改值。

## 后续步骤

1. 进入生成的项目目录：`cd my-server`
2. 如果未自动安装依赖，执行：`npm install` 或 `yarn`
3. 启动开发服务器：`npm run dev` 或 `yarn dev`
4. 在浏览器中访问：`http://localhost:3000`（或您指定的端口）

## 其他命令

生成的项目包含以下有用的 npm 脚本：

- `npm run build`: 构建项目
- `npm run start`: 启动生产环境服务器
- `npm run dev`: 启动开发环境服务器（支持热重载）
- `npm run test`: 运行测试
- `npm run lint`: 运行代码风格检查
- `npm run docker:build`: 构建 Docker 镜像（如果启用 Docker）
- `npm run docker:run`: 运行 Docker 容器（如果启用 Docker）
- `npm run aws:deploy`: 部署到 AWS（如果启用 AWS 云服务集成）

## 云服务提供商支持

MCP服务器脚手架工具支持自动生成云服务提供商的配置文件，以便于将您的MCP服务器部署到云服务提供商的平台上。目前支持以下云服务提供商：

### AWS

当选择AWS作为云服务提供商时，脚手架会在项目根目录下创建`aws`目录，包含以下文件：

- `cloudformation.yaml`: AWS CloudFormation模板，用于创建AWS资源
- `sam-template.yaml`: AWS SAM模板，用于部署无服务器应用
- `lambda.js`: AWS Lambda处理程序，用于处理请求
- `deploy.sh`: 部署脚本，提供简单的一键部署
- `README.md`: 详细的部署说明和自定义配置指导

AWS部署支持以下几种方式：
- **AWS Lambda**: 无服务器函数，适合按需计算和自动扩展的场景
- **Amazon EC2**: 虚拟服务器，适合更传统的部署方式
- **AWS Fargate**: 容器化部署，无需管理底层服务器

同时还会在`package.json`中添加以下脚本：

```json
{
  "scripts": {
    "aws:deploy": "./aws/deploy.sh",
    "aws:package": "aws cloudformation package --template-file aws/cloudformation.yaml --s3-bucket YOUR_S3_BUCKET --output-template-file aws/packaged.yaml",
    "aws:deploy:sam": "aws cloudformation deploy --template-file aws/packaged.yaml --stack-name YOUR_STACK_NAME --capabilities CAPABILITY_IAM"
  }
}
```

使用这些脚本，您可以轻松地将MCP服务器打包并部署到AWS上。`deploy.sh`脚本支持多环境部署，如开发、测试和生产环境。

示例：

```bash
# 创建带有AWS支持的项目
mcp-server scaffold --name my-server --cloud-provider aws

# 部署到开发环境
cd my-server
npm run aws:deploy dev

# 部署到生产环境
npm run aws:deploy prod
```

### Google Cloud Platform (GCP)

当选择GCP作为云服务提供商时，脚手架会在项目根目录下创建`gcp`目录，包含以下文件：

- `cloud-run.yaml`: Google Cloud Run配置，用于无服务器容器部署
- `cloudbuild.yaml`: Google Cloud Build配置，用于自动化构建和部署流程
- `cloud-functions.js`: Google Cloud Functions处理程序，用于无服务器函数部署
- `deploy.sh`: 部署脚本，简化部署过程
- `README.md`: 详细的部署文档和故障排除指南

GCP部署支持以下几种方式：
- **Cloud Run**: 完全托管的容器平台，无需管理基础设施
- **Cloud Functions**: 事件驱动的无服务器计算平台
- **Compute Engine**: 虚拟机实例，适合自定义配置

同时还会在`package.json`中添加以下脚本：

```json
{
  "scripts": {
    "gcp:deploy": "./gcp/deploy.sh",
    "gcp:build": "gcloud builds submit --config=gcp/cloudbuild.yaml"
  }
}
```

部署脚本支持多环境配置和自定义项目ID，使您能够轻松切换部署环境。

示例：

```bash
# 创建带有GCP支持的项目
mcp-server scaffold --name my-server --cloud-provider gcp

# 部署到GCP
cd my-server
npm run gcp:deploy

# 或者手动运行构建和部署
npm run gcp:build
```

### Microsoft Azure

当选择Azure作为云服务提供商时，脚手架会在项目根目录下创建`azure`目录，包含以下文件：

- `app-service.json`: Azure App Service ARM模板，用于Web应用部署
- `function-app.json`: Azure Function App ARM模板，用于无服务器函数部署
- `container-app.json`: Azure Container App ARM模板，用于容器化应用部署
- `function.js`: Azure Function处理程序，处理无服务器函数逻辑
- `deploy.sh`: 部署脚本，支持多种部署选项
- `README.md`: 详细的Azure部署文档和最佳实践指南

Azure部署支持以下几种方式：
- **App Service**: 完全托管的Web应用平台
- **Azure Functions**: 事件驱动的无服务器计算
- **Container Apps**: 无服务器容器应用托管服务
- **Azure Kubernetes Service**: 托管Kubernetes服务（如果同时启用了K8s选项）

同时还会在`package.json`中添加以下脚本：

```json
{
  "scripts": {
    "azure:deploy": "./azure/deploy.sh",
    "azure:deploy:app": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/app-service.json",
    "azure:deploy:function": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/function-app.json",
    "azure:deploy:container": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/container-app.json"
  }
}
```

部署脚本自动处理资源组创建、应用部署和配置设置，简化整个过程。

示例：

```bash
# 创建带有Azure支持的项目
mcp-server scaffold --name my-server --cloud-provider azure

# 部署到Azure
cd my-server
npm run azure:deploy

# 或仅部署特定服务
npm run azure:deploy:app      # 部署到App Service
npm run azure:deploy:function # 部署到Function App
npm run azure:deploy:container # 部署到Container App
```

### 阿里云

当选择阿里云作为云服务提供商时，脚手架会在项目根目录下创建`alibaba`目录，包含以下文件：

- `fc-template.json`: 阿里云函数计算(Function Compute)模板，用于无服务器部署
- `ecs-template.json`: 阿里云云服务器(ECS)模板，用于虚拟机部署
- `ack-template.json`: 阿里云容器服务Kubernetes版(ACK)模板，用于容器编排
- `fc-handler.js`: 函数计算处理程序，处理函数计算的请求
- `deploy.sh`: 部署脚本，支持所有阿里云产品的部署
- `README.md`: 中英双语部署文档和步骤说明

阿里云部署支持以下几种方式：
- **函数计算(FC)**: 无服务器计算平台，按量付费
- **弹性计算服务(ECS)**: 虚拟机实例，适合传统应用架构
- **容器服务Kubernetes版(ACK)**: 容器编排服务，适合微服务架构
- **Web应用托管服务(SAE)**: 应用托管平台，简化Web应用部署流程

同时还会在`package.json`中添加以下脚本：

```json
{
  "scripts": {
    "alibaba:deploy:fc": "./alibaba/deploy.sh fc",
    "alibaba:deploy:ecs": "./alibaba/deploy.sh ecs",
    "alibaba:deploy:ack": "./alibaba/deploy.sh ack"
  }
}
```

部署脚本支持环境变量配置和资源规格选择，灵活适应不同场景需求。

示例：

```bash
# 创建带有阿里云支持的项目
mcp-server scaffold --name my-server --cloud-provider alibaba

# 部署到函数计算(FC)
cd my-server
npm run alibaba:deploy:fc

# 部署到云服务器(ECS)
npm run alibaba:deploy:ecs

# 部署到容器服务Kubernetes版(ACK)
npm run alibaba:deploy:ack
```

### 云服务提供商对比

各云服务提供商的特点对比：

| 特性 | AWS | GCP | Azure | 阿里云 |
|------|-----|-----|-------|--------|
| 无服务器计算 | Lambda | Cloud Functions | Azure Functions | 函数计算 |
| 容器服务 | ECS | Cloud Run | Container Apps | 容器服务 |
| Kubernetes | EKS | GKE | AKS | ACK |
| 虚拟机 | EC2 | Compute Engine | Virtual Machines | ECS |
| 部署模板 | CloudFormation | Deployment Manager | ARM Templates | ROS |
| 自动扩展 | 支持 | 支持 | 支持 | 支持 |
| 区域可用性 | 全球多区域 | 全球多区域 | 全球多区域 | 中国和国际区域 |

### 最佳实践

无论选择哪种云服务提供商，以下最佳实践可以帮助您更有效地部署和管理MCP服务器：

1. **环境变量管理**: 使用环境变量存储敏感信息和配置，避免硬编码
2. **监控和日志**: 配置适当的监控和日志收集，及时发现和解决问题
3. **资源限制**: 设置适当的资源限制，避免成本超出预期
4. **自动化部署**: 利用CI/CD流程自动化部署过程，提高效率
5. **多环境支持**: 为开发、测试和生产环境创建独立的配置

### 不使用云服务提供商

如果不需要部署到云服务提供商，可以将`--cloud-provider`选项设置为`none`：

```bash
mcp-server scaffold --name my-server --cloud-provider none
```

即使不使用云服务提供商，您仍然可以使用Docker、Kubernetes和Helm选项创建可容器化和可移植的MCP服务器。 