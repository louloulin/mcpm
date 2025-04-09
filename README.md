# mcpm

一个基于MCP(Model Control Protocol)框架的服务器管理工具

## 项目简介

mcpm是一个强大的MCP框架服务器管理工具，提供完整的服务器生命周期管理、API集成和自动化部署能力。本项目支持多种部署环境，可以灵活集成到各种云平台和应用场景中。

## 功能特点

- 完整的服务器生命周期管理
  - 快速创建和配置服务器
  - 自动化部署和更新
  - 实时监控和日志管理
  - 性能指标收集和分析
- 多云平台支持
  - AWS (Lambda, ECS, EC2)
  - Google Cloud Platform (Cloud Run, GKE)
  - Microsoft Azure (App Service, AKS)
  - 阿里云 (ECS, 函数计算)
- 企业级功能
  - 用户认证和权限管理
  - 角色基础访问控制(RBAC)
  - Webhook事件通知
  - 第三方工具集成
- 开发者友好
  - RESTful API接口
  - 完整的SDK支持
  - 插件化架构
  - 详尽的文档

## 安装

### 前置要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- 支持的操作系统: Linux, macOS, Windows

### 基本安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/mcpm.git
cd mcpm

# 安装依赖
npm install
```

### 使用MCPM安装

您也可以使用MCPM命令行工具进行全局安装:

```bash
# 全局安装MCPM工具
npm install -g mcpm

# 安装mcpm服务器
mcpm install mcpm
```

## 快速开始

启动服务器:

```bash
npm start
```

服务器默认在3000端口启动。验证安装:

```bash
# 检查服务器状态
curl http://localhost:3000/api/v1/status

# 使用API密钥进行认证测试
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:3000/api/v1/auth/verify
```

| 信息项 | 值 |
|-------|-----|
| 邮箱 | admin@example.com |
| 密码 | admin123 |
| 用户名 | admin |


## API参考

所有API端点都以 `/api/v1` 为基础路径，需要通过Bearer Token进行认证：

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 主要API分类

#### 服务器管理
- `GET /api/v1/servers` - 列出所有服务器
- `POST /api/v1/servers` - 创建新服务器
- `GET /api/v1/servers/{id}` - 获取服务器详情
- `PUT /api/v1/servers/{id}` - 更新服务器配置
- `DELETE /api/v1/servers/{id}` - 删除服务器

#### 部署操作
- `POST /api/v1/deployment/{id}/deploy` - 部署服务器
- `GET /api/v1/deployment/{id}/status` - 获取部署状态
- `GET /api/v1/deployment/{id}/logs` - 获取部署日志

#### 监控与指标
- `GET /api/v1/monitoring/{id}/metrics` - 获取性能指标
- `GET /api/v1/monitoring/{id}/health` - 检查健康状态
- `GET /api/v1/monitoring/{id}/alerts` - 获取告警信息

#### 用户管理
- `POST /api/v1/users` - 创建用户
- `GET /api/v1/users/me` - 获取当前用户信息
- `PUT /api/v1/users/{id}/roles` - 更新用户角色

完整API文档请参考 [API参考文档](./docs/api/README.md)

## 配置

### 环境变量

在 `.env` 文件中配置以下参数:

```env
# 服务器配置
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mcpm
DB_USER=admin

# API配置
API_VERSION=v1
API_RATE_LIMIT=100
API_TIMEOUT=30000

# 安全配置
JWT_SECRET=your-secret-key
ENABLE_2FA=true
```

### 配置文件

主要配置文件位于 `config/` 目录:

```
config/
├── default.json     # 默认配置
├── development.json # 开发环境配置
├── production.json  # 生产环境配置
└── test.json       # 测试环境配置
```

## 开发指南

### 项目结构

```
mcpm/
├── src/                 # 源代码
│   ├── api/            # API实现
│   │   ├── v1/         # API版本1
│   │   └── middleware/ # API中间件
│   ├── core/           # 核心功能
│   ├── models/         # 数据模型
│   ├── services/       # 业务服务
│   └── utils/          # 工具函数
├── config/             # 配置文件
├── docs/              # 文档
│   ├── api/           # API文档
│   └── guides/        # 使用指南
├── tests/             # 测试文件
└── plugins/           # 插件目录
```

### 本地开发

```bash
# 启动开发模式
npm run dev

# 运行测试
npm test

# 构建文档
npm run docs:build

# 代码检查
npm run lint
```

### 插件开发

创建自定义插件:

1. 在 `plugins/` 目录创建新插件
2. 实现插件接口
3. 注册插件

示例插件结构:
```typescript
// plugins/my-plugin/index.ts
import { Plugin } from '@mcpm/core';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  
  async onInit() {
    // 初始化逻辑
  }
  
  async onServerStart() {
    // 服务器启动时的处理
  }
}
```

## 部署

### Docker部署

项目包含优化的多阶段构建Dockerfile，可以轻松构建和部署容器：

```bash
# 构建镜像
docker build -t mcpm:latest .

# 运行容器
docker run -d --name mcpm-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=db.example.com \
  -e JWT_SECRET=your-secret-key \
  -v $(pwd)/data:/app/data \
  mcpm:latest
```

#### Docker镜像特点

- **多阶段构建**：优化镜像大小和构建过程
- **安全增强**：使用非root用户运行应用
- **健康检查**：内置容器健康监控
- **环境变量配置**：支持通过环境变量覆盖配置

#### 使用Docker Compose

创建`docker-compose.yml`文件：

```yaml
version: '3.8'

services:
  mcpm:
    build: .
    container_name: mcpm-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=mcpm
      - DB_USER=mcpmuser
      - DB_PASSWORD=mcpmpassword
      - JWT_SECRET=your-secret-key
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  postgres:
    image: postgres:13-alpine
    container_name: mcpm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=mcpmuser
      - POSTGRES_PASSWORD=mcpmpassword
      - POSTGRES_DB=mcpm
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

启动服务：

```bash
docker-compose up -d
```

### Kubernetes部署

```bash
# 部署到Kubernetes
kubectl apply -f k8s/

# 检查部署状态
kubectl get pods -l app=mcpm

# 查看日志
kubectl logs -l app=mcpm
```

### 云平台部署

使用MCPM CLI工具部署:

```bash
# AWS部署
mcpm deploy aws --env production --region us-east-1

# GCP部署
mcpm deploy gcp --project-id my-project --region us-central1

# Azure部署
mcpm deploy azure --resource-group my-rg --region eastus
```

## 监控和日志

### 性能监控

- 支持Prometheus指标收集
- Grafana仪表板模板
- 自定义告警配置

### 日志管理

- 结构化日志输出
- ELK集成支持
- 日志级别控制

## 安全

- JWT认证
- RBAC权限控制
- API速率限制
- 数据加密传输
- 安全审计日志

## 文档

完整文档请参考:
- [入门指南](./docs/guides/getting-started.md)
- [API文档](./docs/api/README.md)
- [部署指南](./docs/deployment/README.md)
- [最佳实践](./docs/guides/best-practices.md)
- [故障排除](./docs/guides/troubleshooting.md)

## 贡献指南

我们欢迎各种形式的贡献，包括但不限于:

- 功能改进和错误修复
- 文档完善
- 测试用例编写
- 性能优化建议

贡献流程:

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目基于MIT许可证发布 - 详见 [LICENSE](LICENSE) 文件。

## 支持与社区

- [官方文档](https://docs.mcpm.io)
- [GitHub Issues](https://github.com/yourusername/mcpm/issues)
- [社区论坛](https://forum.mcpm.io)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mcpm)

## 联系我们

- 邮件: support@mcpm.io
- Twitter: [@mcpm_official](https://twitter.com/mcpm_official)
- GitHub: [mcpm](https://github.com/yourusername/mcpm)

## 框架适配器

MCPM 3.0提供了强大的框架适配器系统，使开发者能够轻松地将MCP工具集成到各种AI框架中。目前支持以下框架：

- LangChain
- Mastra
- Chainlit
- LlamaIndex
- Haystack
- Flowise
- AutoGen
- Semantic Kernel

详细文档请查看 [框架适配器文档](docs/framework-adapters.md)。

### 测试框架适配器

MCPM提供了全面的测试套件，确保框架适配器的正确性和可靠性。要运行框架适配器测试，请执行：

```bash
npm run test:adapters
```

要生成覆盖率报告，请执行：

```bash
npm run test:coverage
```
