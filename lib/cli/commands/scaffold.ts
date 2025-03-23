import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import ora from 'ora';

interface ScaffoldOptions {
  name: string;
  description: string;
  author: string;
  version: string;
  transport: 'stdio' | 'http' | 'both';
  typescript: boolean;
  installDeps: boolean;
  destination: string;
  docker: boolean;
  cicd: boolean;
  cicdPlatform: 'github' | 'gitlab' | 'circleci' | 'both' | 'all' | 'none';
}

const DEFAULT_OPTIONS: Partial<ScaffoldOptions> = {
  version: '1.0.0',
  transport: 'both',
  typescript: true,
  installDeps: true,
  docker: false,
  cicd: false,
  cicdPlatform: 'github'
};

/**
 * 创建必要的目录结构
 */
function createDirectoryStructure(basePath: string, options: ScaffoldOptions) {
  const dirs = [
    'src',
    'src/tools',
    'src/utils',
    options.transport !== 'stdio' ? 'src/http' : null,
    'test',
    'test/tools',
    'config',
    options.docker ? 'docker' : null,
    options.cicd ? '.github/workflows' : null
  ].filter(Boolean);

  for (const dir of dirs) {
    fs.mkdirSync(path.join(basePath, dir!), { recursive: true });
  }
}

/**
 * 创建基础配置文件
 */
function createConfigFiles(basePath: string, options: ScaffoldOptions) {
  // package.json
  const packageJson = {
    name: options.name,
    version: options.version,
    description: options.description,
    author: options.author,
    license: "MIT",
    main: options.typescript ? "dist/index.js" : "src/index.js",
    types: options.typescript ? "dist/index.d.ts" : undefined,
    scripts: {
      start: options.typescript ? "node dist/index.js" : "node src/index.js",
      dev: options.typescript ? "ts-node src/index.ts" : "nodemon src/index.js",
      build: options.typescript ? "tsc" : "echo 'No build step needed'",
      test: "jest",
      lint: options.typescript ? "eslint 'src/**/*.ts'" : "eslint 'src/**/*.js'",
      "lint:fix": options.typescript ? "eslint 'src/**/*.ts' --fix" : "eslint 'src/**/*.js' --fix",
      ...(options.docker ? {
        "docker:build": "docker build -t " + options.name + " .",
        "docker:run": "docker run -p 3000:3000 " + options.name
      } : {})
    },
    dependencies: {
      "@mcp/core": "^1.0.0",
      "dotenv": "^16.0.3"
    },
    devDependencies: {
      "jest": "^29.5.0",
      "nodemon": "^2.0.22",
      ...(options.typescript ? {
        "@types/jest": "^29.5.0",
        "@types/node": "^18.15.11",
        "ts-jest": "^29.1.0",
        "ts-node": "^10.9.1",
        "typescript": "^5.0.4",
        "eslint": "^8.38.0",
        "@typescript-eslint/eslint-plugin": "^5.59.0",
        "@typescript-eslint/parser": "^5.59.0"
      } : {
        "eslint": "^8.38.0"
      })
    }
  };

  fs.writeFileSync(
    path.join(basePath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // README.md
  const readme = `# ${options.name}

${options.description}

## Installation

\`\`\`bash
npm install ${options.name}
\`\`\`

## Usage

\`\`\`javascript
const { tools } = require('${options.name}');

// Use the tools
\`\`\`

## Available Tools

- Tool1: Description of tool1
- Tool2: Description of tool2

${options.docker ? `
## Docker Support

This project includes Docker support for easy containerization and deployment.

### Build Docker Image

\`\`\`bash
npm run docker:build
\`\`\`

### Run Docker Container

\`\`\`bash
npm run docker:run
\`\`\`
` : ''}

## License

MIT
`;

  fs.writeFileSync(path.join(basePath, 'README.md'), readme);

  // .gitignore
  const gitignore = `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules/

# Coverage
coverage/

# Transpiled files
dist/
build/

# VS Code
.vscode
!.vscode/tasks.js

# JetBrains IDEs
.idea/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Misc
.DS_Store
`;

  fs.writeFileSync(path.join(basePath, '.gitignore'), gitignore);

  // .env and .env.example
  const env = `# Server Configuration
PORT=3000
NODE_ENV=development

# MCP Configuration
MCP_SERVER_ID=${uuidv4()}
MCP_SERVER_NAME=${options.name}
MCP_SERVER_VERSION=${options.version}
`;

  fs.writeFileSync(path.join(basePath, '.env'), env);
  fs.writeFileSync(path.join(basePath, '.env.example'), env);

  // TypeScript configuration if needed
  if (options.typescript) {
    const tsconfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        lib: ["es2020"],
        declaration: true,
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "**/*.test.ts"]
    };

    fs.writeFileSync(
      path.join(basePath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  // Jest configuration
  const jestConfig = options.typescript
    ? `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
};`
    : `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
};`;

  fs.writeFileSync(path.join(basePath, 'jest.config.js'), jestConfig);

  // Create Docker files if requested
  if (options.docker) {
    createDockerFiles(basePath, options);
  }

  // Create CI/CD files if requested
  if (options.cicd) {
    createCICDFiles(basePath, options);
  }
}

/**
 * 创建Docker相关文件
 */
function createDockerFiles(basePath: string, options: ScaffoldOptions) {
  // Dockerfile
  const dockerfile = options.typescript
    ? `FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY .env.example ./.env

RUN npm install --only=production

EXPOSE 3000

# Set environment variable for stdio detection
ENV MCP_STDIO=false

CMD ["node", "dist/index.js"]
`
    : `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .
COPY .env.example ./.env

EXPOSE 3000

# Set environment variable for stdio detection
ENV MCP_STDIO=false

CMD ["node", "src/index.js"]
`;

  fs.writeFileSync(path.join(basePath, 'Dockerfile'), dockerfile);

  // docker-compose.yml
  const dockerCompose = `version: '3'

services:
  ${options.name}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_STDIO=false
    restart: unless-stopped
`;

  fs.writeFileSync(path.join(basePath, 'docker-compose.yml'), dockerCompose);

  // .dockerignore
  const dockerignore = `node_modules
npm-debug.log
.env
.git
.github
coverage
.vscode
.idea
README.md
`;

  fs.writeFileSync(path.join(basePath, '.dockerignore'), dockerignore);

  // Docker README
  const dockerReadme = `# Docker Support

This directory contains Docker-related utilities and documentation for the ${options.name} MCP server.

## Basic Usage

### Build with Docker

\`\`\`bash
docker build -t ${options.name} .
\`\`\`

### Run with Docker

\`\`\`bash
docker run -p 3000:3000 ${options.name}
\`\`\`

### Use Docker Compose

\`\`\`bash
docker-compose up
\`\`\`

## Configuration

The Docker container uses the .env.example file by default. To use custom environment variables:

1. Mount a custom .env file:
   \`\`\`bash
   docker run -p 3000:3000 -v ./my-env-file.env:/app/.env ${options.name}
   \`\`\`

2. Or use environment variables directly:
   \`\`\`bash
   docker run -p 3000:3000 -e PORT=5000 -e NODE_ENV=production ${options.name}
   \`\`\`

## Production Deployment

For production deployment, consider using:

- Docker Swarm
- Kubernetes
- Cloud container services (AWS ECS, Google Cloud Run, etc.)

See the deployment documentation for more details.
`;

  fs.writeFileSync(path.join(basePath, 'docker', 'README.md'), dockerReadme);
}

/**
 * 创建CI/CD相关文件
 */
function createCICDFiles(basePath: string, options: ScaffoldOptions) {
  if (options.cicdPlatform === 'github' || options.cicdPlatform === 'both' || options.cicdPlatform === 'all') {
    createGitHubCICD(basePath, options);
  }
  
  if (options.cicdPlatform === 'gitlab' || options.cicdPlatform === 'both' || options.cicdPlatform === 'all') {
    createGitLabCICD(basePath, options);
  }
  
  if (options.cicdPlatform === 'circleci' || options.cicdPlatform === 'all') {
    createCircleCI(basePath, options);
  }
}

/**
 * 创建GitHub Actions工作流文件
 */
function createGitHubCICD(basePath: string, options: ScaffoldOptions) {
  // 创建目录
  fs.mkdirSync(path.join(basePath, '.github', 'workflows'), { recursive: true });
  
  // GitHub Actions workflow for testing
  const testWorkflow = `name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
`;

  fs.writeFileSync(path.join(basePath, '.github', 'workflows', 'test.yml'), testWorkflow);

  // Docker workflow only if Docker support is enabled
  if (options.docker) {
    // GitHub Actions workflow for Docker build and push
    const dockerWorkflow = `name: Docker

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Docker meta
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ghcr.io/\${{ github.repository_owner }}/${options.name}
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=sha
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to GitHub Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: \${{ github.repository_owner }}
        password: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
`;

    fs.writeFileSync(path.join(basePath, '.github', 'workflows', 'docker.yml'), dockerWorkflow);
  }
}

/**
 * 创建GitLab CI/CD配置文件
 */
function createGitLabCICD(basePath: string, options: ScaffoldOptions) {
  // GitLab CI 基本配置
  let gitlabConfig = `# GitLab CI/CD configuration
stages:
  - test
  - build${options.docker ? '\n  - deploy' : ''}

variables:
  NODE_VERSION: "18"

# Cache dependencies between jobs
cache:
  key: \$CI_COMMIT_REF_SLUG
  paths:
    - node_modules/

# Test stage
test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build --if-present
    - npm test
  coverage: /All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/

# Build stage
build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  only:
    - main
    - tags
`;

  // 如果启用Docker，添加Docker构建和部署配置
  if (options.docker) {
    gitlabConfig += `
# Docker build
docker-build:
  stage: build
  image: docker:20
  services:
    - docker:20-dind
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: ""
  before_script:
    - docker login -u \$CI_REGISTRY_USER -p \$CI_REGISTRY_PASSWORD \$CI_REGISTRY
  script:
    - docker build -t \$CI_REGISTRY_IMAGE:\$CI_COMMIT_REF_SLUG .
    - docker push \$CI_REGISTRY_IMAGE:\$CI_COMMIT_REF_SLUG
    - |
      if [[ "\$CI_COMMIT_BRANCH" == "main" ]]; then
        docker tag \$CI_REGISTRY_IMAGE:\$CI_COMMIT_REF_SLUG \$CI_REGISTRY_IMAGE:latest
        docker push \$CI_REGISTRY_IMAGE:latest
      fi
  only:
    - main
    - tags

# Deploy to staging
deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - 'curl -X POST -F token=\$STAGING_TRIGGER_TOKEN -F ref=main \$STAGING_DEPLOY_TRIGGER_URL'
  environment:
    name: staging
  only:
    - main

# Deploy to production
deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - 'curl -X POST -F token=\$PRODUCTION_TRIGGER_TOKEN -F ref=main \$PRODUCTION_DEPLOY_TRIGGER_URL'
  environment:
    name: production
  only:
    - tags
  when: manual
`;
  }

  fs.writeFileSync(path.join(basePath, '.gitlab-ci.yml'), gitlabConfig);
  
  // 创建GitLab CI文档
  const gitlabDocs = `# GitLab CI/CD 配置说明

本项目已配置GitLab CI/CD流水线，可以自动执行测试、构建${options.docker ? '和部署' : ''}操作。

## 流水线阶段

1. **测试阶段**: 运行自动化测试套件并报告代码覆盖率
2. **构建阶段**: 编译TypeScript代码并生成构建产物${options.docker ? '\n3. **部署阶段**: 根据分支或标签部署到相应环境' : ''}

## 环境${options.docker ? '\n\n项目配置了以下环境：\n\n- **Staging**: 当代码推送到main分支时自动部署\n- **Production**: 当创建新标签时手动触发部署' : ''}

## CI/CD变量

需要在GitLab项目设置中配置以下CI/CD变量：

${options.docker ? '- `STAGING_TRIGGER_TOKEN`: 用于触发Staging环境部署的令牌\n- `STAGING_DEPLOY_TRIGGER_URL`: Staging环境部署触发URL\n- `PRODUCTION_TRIGGER_TOKEN`: 用于触发Production环境部署的令牌\n- `PRODUCTION_DEPLOY_TRIGGER_URL`: Production环境部署触发URL' : '- 目前没有需要配置的变量'}

## 自定义配置

您可以根据项目需求修改 \`.gitlab-ci.yml\` 文件以自定义CI/CD流程。
`;

  fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(basePath, 'docs', 'gitlab-ci.md'), gitlabDocs);
}

/**
 * 创建CircleCI配置文件
 */
function createCircleCI(basePath: string, options: ScaffoldOptions) {
  // 创建 .circleci 目录
  fs.mkdirSync(path.join(basePath, '.circleci'), { recursive: true });
  
  // 基本 CircleCI 配置
  const baseConfig = `version: 2.1
orbs:
  node: circleci/node@5.1.0${options.docker ? '\n  docker: circleci/docker@2.2.0' : ''}

jobs:
  test:
    executor:
      name: node/default
      tag: "18.15.0"
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Run tests
          command: npm test
  
  build:
    executor:
      name: node/default
      tag: "18.15.0"
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Build
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist
            - package.json
            - package-lock.json
`;

  let deployConfig = '';
  
  // 如果启用Docker，添加Docker构建和部署任务
  if (options.docker) {
    deployConfig = `
  docker-build:
    executor: docker/docker
    steps:
      - checkout
      - setup_remote_docker:
          version: "20.10.14"
      - docker/check
      - docker/build:
          image: ${options.name}
          tag: \${CIRCLE_SHA1:0:7},latest
      - docker/push:
          image: ${options.name}
          tag: \${CIRCLE_SHA1:0:7},latest
  
  deploy-staging:
    executor: docker/docker
    steps:
      - checkout
      - run:
          name: Deploy to staging
          command: echo "Deploying to staging environment"
  
  deploy-production:
    executor: docker/docker
    steps:
      - checkout
      - run:
          name: Deploy to production
          command: echo "Deploying to production environment"
`;
  }

  // 添加工作流配置
  let workflowConfig = `
workflows:
  version: 2
  test-and-build:
    jobs:
      - test
      - build
`;

  // 如果启用Docker，添加部署工作流
  if (options.docker) {
    workflowConfig += `      - docker-build:
          requires:
            - build
          filters:
            branches:
              only: main
      - deploy-staging:
          requires:
            - docker-build
          filters:
            branches:
              only: main
      - deploy-production:
          requires:
            - docker-build
          filters:
            branches:
              only: master
            tags:
              only: /^v.*/
`;
  }

  // 将所有配置合并
  const finalConfig = baseConfig + deployConfig + workflowConfig;
  
  // 写入配置文件
  fs.writeFileSync(
    path.join(basePath, '.circleci', 'config.yml'),
    finalConfig
  );
  
  // 创建CircleCI文档
  const circleciDocs = `# CircleCI 配置说明

本项目已配置CircleCI流水线，可以自动执行测试、构建${options.docker ? '、Docker镜像构建和部署' : ''}操作。

## 流水线工作流

1. **测试作业**: 运行自动化测试套件
2. **构建作业**: 编译TypeScript代码并生成构建产物${options.docker ? '\n3. **Docker构建作业**: 构建和推送Docker镜像\n4. **部署作业**: 部署到staging和production环境' : ''}

## 配置CircleCI

要使用CircleCI，您需要：

1. 将项目代码推送到GitHub或Bitbucket
2. 在CircleCI上注册并连接您的仓库
3. 选择您的项目并开始构建

## CircleCI环境变量

以下环境变量需要在CircleCI项目设置中配置：

${options.docker ? '- `DOCKER_USERNAME`: Docker Hub或其他镜像仓库的用户名\n- `DOCKER_PASSWORD`: Docker Hub或其他镜像仓库的密码\n- `DOCKER_REGISTRY`: Docker镜像仓库地址（默认为Docker Hub）' : '- 目前没有需要配置的环境变量'}

## 自定义配置

您可以根据项目需求修改 \`.circleci/config.yml\` 文件以自定义CI/CD流程：

1. 更改Node.js版本
2. 添加更多测试或构建步骤
3. 配置不同的部署目标
4. 添加通知集成

## 最佳实践

1. 确保测试覆盖率高
2. 使用语义化版本标签触发生产部署
3. 利用CircleCI缓存提高构建速度
4. 考虑使用CircleCI的批准工作流进行生产部署
`;
  
  fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(basePath, 'docs', 'circleci.md'), circleciDocs);
}

/**
 * 创建源代码文件
 */
function createSourceFiles(basePath: string, options: ScaffoldOptions) {
  const extension = options.typescript ? 'ts' : 'js';
  
  // Main index file
  const indexContent = options.typescript
    ? `import dotenv from 'dotenv';
import { createServer } from './server';

// 加载环境变量
dotenv.config();

// 启动服务器
createServer();

// 导出工具
export * from './tools';
`
    : `const dotenv = require('dotenv');
const { createServer } = require('./server');

// 加载环境变量
dotenv.config();

// 启动服务器
createServer();

// 导出工具
module.exports = require('./tools');
`;

  fs.writeFileSync(path.join(basePath, 'src', `index.${extension}`), indexContent);

  // Server file
  let serverContent;
  if (options.transport === 'stdio') {
    serverContent = options.typescript
      ? `import { MCPStdioServer } from '@mcp/core';
import { tools } from './tools';

export function createServer() {
  const server = new MCPStdioServer({
    name: process.env.MCP_SERVER_NAME || '${options.name}',
    version: process.env.MCP_SERVER_VERSION || '${options.version}',
    tools
  });
  
  server.start();
  return server;
}
`
      : `const { MCPStdioServer } = require('@mcp/core');
const { tools } = require('./tools');

function createServer() {
  const server = new MCPStdioServer({
    name: process.env.MCP_SERVER_NAME || '${options.name}',
    version: process.env.MCP_SERVER_VERSION || '${options.version}',
    tools
  });
  
  server.start();
  return server;
}

module.exports = { createServer };
`;
  } else if (options.transport === 'http') {
    serverContent = options.typescript
      ? `import { MCPHttpServer } from '@mcp/core';
import { tools } from './tools';
import express from 'express';

export function createServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  const server = new MCPHttpServer({
    name: process.env.MCP_SERVER_NAME || '${options.name}',
    version: process.env.MCP_SERVER_VERSION || '${options.version}',
    tools,
    expressApp: app
  });
  
  app.listen(port, () => {
    console.log(\`HTTP MCP server listening on port \${port}\`);
  });
  
  return server;
}
`
      : `const { MCPHttpServer } = require('@mcp/core');
const { tools } = require('./tools');
const express = require('express');

function createServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  const server = new MCPHttpServer({
    name: process.env.MCP_SERVER_NAME || '${options.name}',
    version: process.env.MCP_SERVER_VERSION || '${options.version}',
    tools,
    expressApp: app
  });
  
  app.listen(port, () => {
    console.log(\`HTTP MCP server listening on port \${port}\`);
  });
  
  return server;
}

module.exports = { createServer };
`;
  } else {
    // Both transports
    serverContent = options.typescript
      ? `import { MCPStdioServer, MCPHttpServer } from '@mcp/core';
import { tools } from './tools';
import express from 'express';

export function createServer() {
  // Detect environment - if running with stdio process.env.MCP_STDIO will be true
  const isStdio = process.env.MCP_STDIO === 'true';
  
  if (isStdio) {
    // Create stdio server for CLI usage
    const stdioServer = new MCPStdioServer({
      name: process.env.MCP_SERVER_NAME || '${options.name}',
      version: process.env.MCP_SERVER_VERSION || '${options.version}',
      tools
    });
    
    stdioServer.start();
    return stdioServer;
  } else {
    // Create HTTP server for REST API usage
    const app = express();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    
    const httpServer = new MCPHttpServer({
      name: process.env.MCP_SERVER_NAME || '${options.name}',
      version: process.env.MCP_SERVER_VERSION || '${options.version}',
      tools,
      expressApp: app
    });
    
    app.listen(port, () => {
      console.log(\`HTTP MCP server listening on port \${port}\`);
    });
    
    return httpServer;
  }
}
`
      : `const { MCPStdioServer, MCPHttpServer } = require('@mcp/core');
const { tools } = require('./tools');
const express = require('express');

function createServer() {
  // Detect environment - if running with stdio process.env.MCP_STDIO will be true
  const isStdio = process.env.MCP_STDIO === 'true';
  
  if (isStdio) {
    // Create stdio server for CLI usage
    const stdioServer = new MCPStdioServer({
      name: process.env.MCP_SERVER_NAME || '${options.name}',
      version: process.env.MCP_SERVER_VERSION || '${options.version}',
      tools
    });
    
    stdioServer.start();
    return stdioServer;
  } else {
    // Create HTTP server for REST API usage
    const app = express();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    
    const httpServer = new MCPHttpServer({
      name: process.env.MCP_SERVER_NAME || '${options.name}',
      version: process.env.MCP_SERVER_VERSION || '${options.version}',
      tools,
      expressApp: app
    });
    
    app.listen(port, () => {
      console.log(\`HTTP MCP server listening on port \${port}\`);
    });
    
    return httpServer;
  }
}

module.exports = { createServer };
`;
  }

  fs.writeFileSync(path.join(basePath, 'src', `server.${extension}`), serverContent);

  // Tools index
  const toolsIndexContent = options.typescript
    ? `import { calculateSum } from './tools/calculator';

export const tools = {
  calculateSum
};

// 导出工具类型
export type { CalculateSumParams, CalculateSumResult } from './tools/calculator';
`
    : `const { calculateSum } = require('./tools/calculator');

const tools = {
  calculateSum
};

module.exports = { tools };
`;

  fs.writeFileSync(path.join(basePath, 'src', 'tools', `index.${extension}`), toolsIndexContent);

  // Sample tool
  const calculatorToolContent = options.typescript
    ? `/**
 * 计算和参数接口
 */
export interface CalculateSumParams {
  /** 第一个数字 */
  a: number;
  /** 第二个数字 */
  b: number;
}

/**
 * 计算和结果接口
 */
export interface CalculateSumResult {
  /** 计算结果 */
  sum: number;
}

/**
 * 计算两个数字的和
 * @param params 计算参数
 * @returns 计算结果
 */
export async function calculateSum(params: CalculateSumParams): Promise<CalculateSumResult> {
  const { a, b } = params;
  
  // 执行计算
  const sum = a + b;
  
  return { sum };
}
`
    : `/**
 * 计算两个数字的和
 * @param {Object} params 计算参数
 * @param {number} params.a 第一个数字
 * @param {number} params.b 第二个数字
 * @returns {Object} 计算结果
 */
async function calculateSum(params) {
  const { a, b } = params;
  
  // 执行计算
  const sum = a + b;
  
  return { sum };
}

module.exports = { calculateSum };
`;

  fs.writeFileSync(path.join(basePath, 'src', 'tools', `calculator.${extension}`), calculatorToolContent);

  // Test file for the sample tool
  const testContent = options.typescript
    ? `import { calculateSum } from '../src/tools/calculator';

describe('Calculator Tool', () => {
  test('calculateSum should add two numbers correctly', async () => {
    const result = await calculateSum({ a: 5, b: 3 });
    expect(result.sum).toBe(8);
  });

  test('calculateSum should work with negative numbers', async () => {
    const result = await calculateSum({ a: -2, b: 5 });
    expect(result.sum).toBe(3);
  });

  test('calculateSum should work with zero', async () => {
    const result = await calculateSum({ a: 0, b: 0 });
    expect(result.sum).toBe(0);
  });
});
`
    : `const { calculateSum } = require('../src/tools/calculator');

describe('Calculator Tool', () => {
  test('calculateSum should add two numbers correctly', async () => {
    const result = await calculateSum({ a: 5, b: 3 });
    expect(result.sum).toBe(8);
  });

  test('calculateSum should work with negative numbers', async () => {
    const result = await calculateSum({ a: -2, b: 5 });
    expect(result.sum).toBe(3);
  });

  test('calculateSum should work with zero', async () => {
    const result = await calculateSum({ a: 0, b: 0 });
    expect(result.sum).toBe(0);
  });
});
`;

  fs.writeFileSync(path.join(basePath, 'test', 'tools', `calculator.test.${extension}`), testContent);
}

/**
 * 安装依赖
 */
function installDependencies(basePath: string) {
  try {
    process.chdir(basePath);
    execSync('npm install', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 执行脚手架命令
 */
export async function scaffoldProject(options: Partial<ScaffoldOptions> = {}) {
  // 开始交互式提问
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '服务器名称:',
      default: options.name || 'my-mcp-server',
      validate: (input: string) => {
        if (/^[a-z0-9-]+$/.test(input)) return true;
        return '名称只能包含小写字母、数字和连字符';
      }
    },
    {
      type: 'input',
      name: 'description',
      message: '服务器描述:',
      default: options.description || 'A custom MCP server'
    },
    {
      type: 'input',
      name: 'author',
      message: '作者:',
      default: options.author || ''
    },
    {
      type: 'input',
      name: 'version',
      message: '初始版本:',
      default: DEFAULT_OPTIONS.version
    },
    {
      type: 'list',
      name: 'transport',
      message: '传输协议:',
      choices: [
        { name: 'stdio (命令行)', value: 'stdio' },
        { name: 'HTTP (REST API)', value: 'http' },
        { name: '两者都支持', value: 'both' }
      ],
      default: DEFAULT_OPTIONS.transport
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: '使用TypeScript?',
      default: DEFAULT_OPTIONS.typescript
    },
    {
      type: 'confirm',
      name: 'docker',
      message: '添加Docker支持?',
      default: DEFAULT_OPTIONS.docker
    },
    {
      type: 'confirm',
      name: 'cicd',
      message: '添加CI/CD支持?',
      default: DEFAULT_OPTIONS.cicd
    },
    {
      type: 'list',
      name: 'cicdPlatform',
      message: '选择CI/CD平台:',
      choices: [
        { name: 'GitHub Actions', value: 'github' },
        { name: 'GitLab CI', value: 'gitlab' },
        { name: 'CircleCI', value: 'circleci' },
        { name: 'GitHub + GitLab', value: 'both' },
        { name: '全部支持', value: 'all' },
        { name: '不使用CI/CD', value: 'none' }
      ],
      default: DEFAULT_OPTIONS.cicdPlatform,
      when: (answers) => answers.cicd
    },
    {
      type: 'input',
      name: 'destination',
      message: '项目目录:',
      default: (answers: any) => path.join(process.cwd(), answers.name)
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: '自动安装依赖?',
      default: DEFAULT_OPTIONS.installDeps
    }
  ]);

  const finalOptions: ScaffoldOptions = { ...DEFAULT_OPTIONS, ...options, ...answers } as ScaffoldOptions;
  
  // 如果用户选择不使用CI/CD，确保cicd属性为false
  if (finalOptions.cicdPlatform === 'none') {
    finalOptions.cicd = false;
  }
  
  // 创建项目
  console.log(chalk.blue('\n开始创建MCP服务器项目...\n'));
  
  // 检查目标路径
  if (fs.existsSync(finalOptions.destination)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `目录 ${finalOptions.destination} 已存在。是否继续? (将覆盖现有文件)`,
        default: false
      }
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('\n操作已取消'));
      return;
    }
  }
  
  // 创建目录结构
  const spinner = ora('创建项目结构...').start();
  try {
    fs.mkdirSync(finalOptions.destination, { recursive: true });
    createDirectoryStructure(finalOptions.destination, finalOptions);
    spinner.succeed('项目结构创建完成');
  } catch (error) {
    spinner.fail(`创建项目结构失败: ${error}`);
    return;
  }
  
  // 创建配置文件
  spinner.text = '创建配置文件...';
  spinner.start();
  try {
    createConfigFiles(finalOptions.destination, finalOptions);
    spinner.succeed('配置文件创建完成');
  } catch (error) {
    spinner.fail(`创建配置文件失败: ${error}`);
    return;
  }
  
  // 创建源代码文件
  spinner.text = '创建源代码文件...';
  spinner.start();
  try {
    createSourceFiles(finalOptions.destination, finalOptions);
    spinner.succeed('源代码文件创建完成');
  } catch (error) {
    spinner.fail(`创建源代码文件失败: ${error}`);
    return;
  }
  
  // 安装依赖
  if (finalOptions.installDeps) {
    spinner.text = '安装依赖...';
    spinner.start();
    try {
      const success = installDependencies(finalOptions.destination);
      if (success) {
        spinner.succeed('依赖安装完成');
      } else {
        spinner.warn('依赖安装失败，请稍后手动运行npm install');
      }
    } catch (error) {
      spinner.warn(`依赖安装失败: ${error}`);
    }
  }
  
  // 完成
  console.log(chalk.green('\n✨ MCP服务器项目创建成功!\n'));
  console.log('项目位置:', chalk.cyan(finalOptions.destination));
  console.log('\n运行以下命令开始开发:');
  console.log(chalk.cyan(`  cd ${finalOptions.name}`));
  
  if (!finalOptions.installDeps) {
    console.log(chalk.cyan('  npm install'));
  }
  
  console.log(chalk.cyan('  npm run dev'));

  if (finalOptions.docker) {
    console.log('\n使用Docker:');
    console.log(chalk.cyan('  npm run docker:build'));
    console.log(chalk.cyan('  npm run docker:run'));
  }
  
  console.log('\n开发愉快! 🚀\n');
}

/**
 * 注册脚手架命令
 */
export function scaffoldCommand(program: Command) {
  program
    .command('scaffold')
    .description('创建新的MCP服务器项目脚手架')
    .option('-n, --name <name>', '服务器名称')
    .option('-d, --description <description>', '服务器描述')
    .option('-a, --author <author>', '作者')
    .option('-v, --version <version>', '初始版本')
    .option('-t, --transport <transport>', '传输协议 (stdio, http, both)')
    .option('-ts, --typescript', '使用TypeScript')
    .option('-i, --install-deps', '自动安装依赖')
    .option('--docker', '添加Docker支持')
    .option('--cicd', '添加CI/CD支持')
    .option('--cicd-platform <platform>', 'CI/CD平台 (github, gitlab, circleci, both, all)')
    .action((options) => scaffoldProject(options));
} 