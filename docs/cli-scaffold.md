# MCP服务器脚手架命令

`scaffold`命令是一个强大的工具，可帮助您快速创建新的MCP服务器项目。它提供了一个交互式界面，引导您完成创建项目所需的各种选项，并生成一个包含必要文件和结构的完整项目。

## 用法

```bash
mcpm scaffold [options]
```

## 选项

| 选项                | 描述                                   | 默认值    |
|---------------------|----------------------------------------|-----------|
| `--name`            | 项目名称                               | 当前目录名|
| `--description`     | 项目描述                               | "MCP Server" |
| `--author`          | 项目作者                               | 当前用户  |
| `--version`         | 项目初始版本                           | "1.0.0"   |
| `--protocol`        | 传输协议 (stdio, http, or both)        | "stdio"   |
| `--typescript`      | 使用TypeScript                         | true      |
| `--dir`             | 项目目录                               | 当前目录  |
| `--skip-install`    | 跳过依赖安装                           | false     |
| `--docker`          | 添加Docker支持                         | false     |
| `--cicd`            | 添加CI/CD支持                          | false     |
| `--cicd-platform`   | 指定CI/CD平台 (github, gitlab, circleci, all) | "github" |

## 示例

### 创建一个基本的MCP服务器

```bash
mcp scaffold myserver
```

### 使用HTTP协议创建服务器

```bash
mcp scaffold --name myserver --protocol http
```

### 创建支持Docker的服务器

```bash
mcp scaffold --name docker-server --docker
```

### 创建带有GitHub Actions的CI/CD服务器

```bash
mcp scaffold --name ci-server --cicd
```

### 创建带有GitLab CI的服务器

```bash
mcp scaffold --name gitlab-server --cicd --cicd-platform gitlab
```

### 创建带有CircleCI的服务器

```bash
mcp scaffold --name circle-server --cicd --cicd-platform circleci
```

### 创建支持所有CI/CD平台的服务器

```bash
mcp scaffold --name full-server --cicd --cicd-platform all
```

### 创建完整功能的服务器（Docker + 所有CI/CD平台）

```bash
mcp scaffold --name full-server --docker --cicd --cicd-platform all
```

## 生成的项目结构

脚手架命令生成的项目具有以下结构：

```
my-server/
├── .github/                 # GitHub Actions工作流配置（如果选择）
│   └── workflows/
│       ├── test.yml
│       └── build.yml
├── .gitlab/                 # GitLab CI/CD配置（如果选择）
│   └── ci/
│       ├── test.yml
│       └── build.yml
├── .gitlab-ci.yml           # GitLab CI主配置（如果选择）
├── .circleci/               # CircleCI配置（如果选择）
│   └── config.yml
├── .dockerignore            # Docker忽略文件（如果启用Docker）
├── Dockerfile               # Docker配置文件（如果启用Docker）
├── docker-compose.yml       # Docker Compose配置（如果启用Docker）
├── src/                     # 源代码目录
│   └── index.ts             # 主入口文件
├── dist/                    # 编译输出目录（TypeScript）
├── tests/                   # 测试目录
│   └── index.test.ts        # 测试文件
├── docs/                    # 文档目录
│   ├── github-actions.md    # GitHub Actions文档（如果选择）
│   ├── gitlab-ci.md         # GitLab CI/CD文档（如果选择）
│   ├── circleci.md          # CircleCI文档（如果选择）
│   └── docker.md            # Docker使用文档（如果启用Docker）
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置（如果启用）
└── README.md                # 项目说明文档
```

## 传输协议选项

脚手架支持三种传输协议模式：

1. **stdio** - 仅标准输入/输出传输，适合命令行工具集成
2. **http** - 仅HTTP传输，适合REST API和Web集成
3. **both** - 同时支持stdio和HTTP，提供最大灵活性

## Docker支持

启用Docker支持时，脚手架会生成以下文件:

1. **Dockerfile** - 配置容器构建，TypeScript项目使用多阶段构建
2. **docker-compose.yml** - 简化容器编排和部署
3. **.dockerignore** - 排除不需要的文件
4. **docker/README.md** - Docker使用说明文档

此外，`package.json`中会添加以下脚本:

```json
{
  "scripts": {
    "docker:build": "docker build -t your-server-name .",
    "docker:run": "docker run -p 3000:3000 your-server-name"
  }
}
```

### 使用Docker

构建Docker镜像:
```bash
npm run docker:build
```

运行Docker容器:
```bash
npm run docker:run
```

使用Docker Compose:
```bash
docker-compose up
```

## CI/CD支持

脚手架命令支持以下CI/CD平台:

### GitHub Actions

启用GitHub Actions时，脚手架会生成以下工作流配置:

1. **test.yml** - 自动测试工作流，在推送和PR时运行
2. **docker.yml** - 自动构建和发布Docker镜像工作流（如果启用Docker支持）

这些工作流将:
- 在多个Node.js版本上自动运行测试
- 在推送标签时构建和发布Docker镜像到GitHub Container Registry

### GitLab CI/CD

启用GitLab CI/CD时，脚手架会生成以下文件:

1. **.gitlab-ci.yml** - GitLab CI/CD流水线配置
2. **docs/gitlab-ci.md** - GitLab CI/CD配置文档

GitLab CI/CD流水线包括以下阶段:
- **测试阶段**: 自动运行单元测试和生成代码覆盖率报告
- **构建阶段**: 编译代码并生成构建产物
- **部署阶段**: 如果启用了Docker支持，添加自动部署到staging和production环境的任务

### 同时支持多平台

您可以选择同时支持GitHub Actions和GitLab CI/CD，脚手架会同时生成两个平台的配置文件。这在需要跨平台兼容性或正在评估不同CI/CD解决方案时特别有用。

## 功能示例

生成的项目包含一个简单的计算器工具示例，展示了如何创建和测试MCP工具。您可以基于此示例进一步开发自己的工具。

## 自定义模板

您可以修改生成的项目以满足特定需求：

1. 添加更多工具到`src/tools/`目录
2. 自定义HTTP路由（如果使用HTTP传输）
3. 扩展服务器配置
4. 添加数据库连接和模型
5. 修改Docker配置以满足特定部署需求
6. 调整CI/CD工作流以适应您的开发流程
7. 为不同环境添加自定义部署流程

## 最佳实践

1. 为每个工具创建完整的测试
2. 使用语义化版本控制
3. 发布前在多种环境中测试
4. 确保所有工具都有良好的错误处理
5. 提供详细文档，包括输入输出示例
6. 使用Docker进行开发环境隔离和简化部署
7. 利用CI/CD实现自动化测试和部署
8. 根据项目规模选择适合的CI/CD平台:
   - 小型开源项目: GitHub Actions通常足够
   - 大型企业项目: GitLab CI/CD提供更多自定义选项

## 故障排除

如果遇到问题：

- 确保已经安装了所有必要的依赖
- 检查生成的项目中的`.env`文件配置
- 对于HTTP传输，确保端口未被占用
- 使用`--typescript`选项时，确保已安装TypeScript
- Docker问题: 确保Docker守护进程正在运行
- GitHub Actions问题: 检查仓库权限和密钥配置
- GitLab CI/CD问题: 验证Runner配置和CI/CD变量设置 