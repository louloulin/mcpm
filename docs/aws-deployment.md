# AWS 部署指南

本文档提供了在 AWS (Amazon Web Services) 上部署 MCP 服务器的详细指南。脚手架工具生成的 AWS 配置支持两种部署模式：ECS Fargate（容器化）和 Lambda（无服务器），让您可以根据需求选择最合适的部署方式。

## 前提条件

在开始部署前，请确保您已经：

1. 创建了 AWS 账户
2. 安装并配置了 [AWS CLI](https://aws.amazon.com/cli/)
3. 安装了 [Docker](https://www.docker.com/get-started)（用于容器化部署）
4. 安装了 [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)（用于无服务器部署）

## 部署选项

### 1. ECS Fargate 部署（容器化）

ECS Fargate 是一种无需管理服务器的容器计算服务，适合需要持续运行的应用程序。

#### 优势

- 无需管理底层基础设施
- 按需自动扩展
- 适合长时间运行的应用
- 与容器生态系统完全兼容

#### CloudFormation 资源

脚手架生成的 CloudFormation 模板 (`aws/cloudformation.yml`) 创建以下资源：

- **网络**：VPC、子网、互联网网关、路由表
- **计算**：ECS 集群、任务定义、Fargate 服务
- **存储**：ECR（容器镜像仓库）
- **负载均衡**：应用负载均衡器、目标组
- **安全**：安全组、IAM 角色和策略
- **监控**：CloudWatch 日志组
- **自动扩展**：应用自动扩展策略

#### 部署步骤

1. **更新配置**：

   打开 `package.json` 并更新 AWS 相关脚本，替换以下占位符：
   - `YOUR_AWS_ACCOUNT_ID`：AWS 账户 ID
   - `YOUR_REGION`：部署区域（如 `us-east-1`）
   - `YOUR_S3_BUCKET`：用于存储 SAM 模板的 S3 桶

2. **执行部署脚本**：

   ```bash
   # 给脚本添加执行权限（如果尚未添加）
   chmod +x ./aws/deploy.sh
   
   # 部署到开发环境
   ./aws/deploy.sh dev
   
   # 或部署到生产环境
   ./aws/deploy.sh prod
   ```

   或使用 npm 脚本：

   ```bash
   npm run aws:deploy
   ```

3. **检查部署状态**：

   脚本执行完成后，将显示负载均衡器的 DNS 名称。您可以访问此 URL 来测试您的应用。

   ```bash
   # 查看堆栈状态
   aws cloudformation describe-stacks --stack-name your-app-name-dev
   ```

4. **查看日志**：

   ```bash
   # 查看 ECS 服务日志
   aws logs get-log-events --log-group-name /ecs/your-app-name-dev --log-stream-name your-log-stream
   ```

### 2. Lambda 部署（无服务器）

AWS Lambda 是一种事件驱动的无服务器计算服务，适合短时运行的应用和 API。

#### 优势

- 极低的基础设施管理要求
- 按使用付费模式（空闲时不收费）
- 自动扩展以处理任何规模的请求
- 集成 API Gateway 提供 HTTP 端点

#### SAM 模板资源

脚手架生成的 SAM 模板 (`aws/sam-template.yml`) 创建以下资源：

- **计算**：Lambda 函数
- **API**：HTTP API（API Gateway）
- **监控**：CloudWatch 日志组
- **安全**：IAM 角色和策略

#### 部署步骤

1. **构建应用**：

   首先构建您的 TypeScript 应用：

   ```bash
   npm run build
   ```

2. **创建 S3 桶**（如果尚未创建）：

   ```bash
   aws s3 mb s3://your-deployment-bucket-name
   ```

3. **打包应用**：

   ```bash
   npm run aws:package
   ```

   或直接使用 AWS SAM CLI：

   ```bash
   aws cloudformation package \
     --template-file aws/sam-template.yml \
     --s3-bucket your-deployment-bucket-name \
     --output-template-file aws/packaged.yml
   ```

4. **部署应用**：

   ```bash
   npm run aws:sam:deploy
   ```

   或直接使用 AWS CloudFormation：

   ```bash
   aws cloudformation deploy \
     --template-file aws/packaged.yml \
     --stack-name your-app-name-sam \
     --capabilities CAPABILITY_IAM
   ```

5. **获取 API URL**：

   ```bash
   aws cloudformation describe-stacks \
     --stack-name your-app-name-sam \
     --query "Stacks[0].Outputs[?OutputKey=='MCPServerApi'].OutputValue" \
     --output text
   ```

## 配置参数

### ECS Fargate 部署参数

您可以通过修改 `cloudformation.yml` 或在部署时提供参数来自定义 ECS 部署：

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `Environment` | 环境名称 | `dev` |
| `ContainerPort` | 容器暴露的端口 | `3000` |
| `DesiredCount` | 任务实例数量 | `1` |
| `MaxCount` | 最大实例数 | `5` |
| `ContainerMemory` | 分配给容器的内存 (MiB) | `512` |
| `ContainerCpu` | 分配给容器的 CPU 单位 | `256` |

例如，部署时指定参数：

```bash
aws cloudformation deploy \
  --template-file ./aws/cloudformation.yml \
  --stack-name your-app-name-prod \
  --parameter-overrides \
      Environment=prod \
      ContainerPort=3000 \
      DesiredCount=2 \
      MaxCount=10 \
      ContainerMemory=1024 \
      ContainerCpu=512 \
  --capabilities CAPABILITY_IAM
```

### Lambda 部署参数

Lambda 函数配置可以通过修改 `sam-template.yml` 文件来调整：

| 配置 | 描述 | 默认值 |
|------|------|--------|
| `Timeout` | 函数超时时间 (秒) | `30` |
| `MemorySize` | 函数内存大小 (MB) | `256` |
| `Runtime` | Node.js 运行时版本 | `nodejs16.x` |

## 环境变量

### ECS Fargate 环境变量

容器任务定义中设置了以下环境变量：

- `NODE_ENV`: 当前环境 (`production`, `development`)
- `PORT`: 应用端口

### Lambda 环境变量

Lambda 函数中设置了以下环境变量：

- `NODE_ENV`: 设置为 `production`

## 安全最佳实践

### 存储敏感数据

对于敏感信息（如 API 密钥、数据库凭证等），不要直接在 CloudFormation 模板中硬编码，而应使用以下方法：

1. **AWS Secrets Manager**:

   ```yaml
   # 在 CloudFormation 模板中
   Environment:
     Variables:
       DB_PASSWORD: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
   ```

2. **AWS Parameter Store**:

   ```yaml
   # 在 CloudFormation 模板中
   Environment:
     Variables:
       API_KEY: !Sub '{{resolve:ssm:/your-app/${Environment}/api-key}}'
   ```

### IAM 权限

模板生成的 IAM 角色遵循最小权限原则。如果您的应用需要额外的 AWS 服务访问权限，请在 CloudFormation 模板中添加相应的 IAM 策略。

## 监控和日志

### CloudWatch 日志

所有应用日志都会发送到 CloudWatch 日志组：

- ECS 服务: `/ecs/your-app-name`
- Lambda 函数: `/aws/lambda/your-app-name-function`

查看日志：

```bash
# ECS 日志
aws logs get-log-events --log-group-name /ecs/your-app-name --log-stream-name your-log-stream

# Lambda 日志
aws logs get-log-events --log-group-name /aws/lambda/your-app-name-function --log-stream-name your-log-stream
```

### CloudWatch 指标

您可以在 CloudWatch 控制台中查看以下指标：

- ECS 服务: CPU 利用率、内存利用率、任务计数
- Lambda 函数: 调用次数、错误率、延迟、并发执行

## 故障排除

### 常见问题

1. **部署失败**

   - 检查 CloudFormation 事件:
     ```bash
     aws cloudformation describe-stack-events --stack-name your-app-name
     ```
   - 确保 IAM 用户有足够的权限
   - 验证 S3 桶是否存在（用于 SAM 部署）

2. **容器启动失败**

   - 检查 ECS 任务状态:
     ```bash
     aws ecs describe-tasks --cluster your-app-name-cluster --tasks your-task-id
     ```
   - 查看 CloudWatch 日志了解具体错误
   - 确保镜像已正确推送到 ECR 仓库

3. **Lambda 函数错误**

   - 查看 Lambda 函数日志
   - 检查 IAM 角色权限
   - 验证代码是否成功打包和部署

4. **API 请求失败**

   - 检查 API Gateway 配置
   - 验证 Lambda 函数是否正确响应
   - 检查安全组和网络配置

## 卸载资源

当您不再需要部署的资源时，可以删除它们以避免不必要的费用：

```bash
# 删除 ECS 部署
aws cloudformation delete-stack --stack-name your-app-name-dev

# 删除 Lambda 部署
aws cloudformation delete-stack --stack-name your-app-name-sam
```

## 成本优化

### ECS Fargate

- 使用 Fargate Spot 实例降低非关键应用成本
- 调整任务大小以匹配实际工作负载
- 实现自动扩展以根据需求增减容量

### Lambda

- 优化函数内存设置以平衡成本和性能
- 使用预置并发应对可预测的工作负载
- 实现函数代码压缩减少执行时间

## 扩展阅读

- [AWS CloudFormation 文档](https://docs.aws.amazon.com/cloudformation/)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate 文档](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Lambda 文档](https://docs.aws.amazon.com/lambda/)
- [AWS SAM 文档](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS ECR 文档](https://docs.aws.amazon.com/ecr/) 