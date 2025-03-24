import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import ora from 'ora';
import { exec } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'fs';
import fsExtra from 'fs-extra';
import { join, resolve } from 'path';
import { promisify } from 'util';

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
  cicdPlatform: 'github' | 'gitlab' | 'circleci' | 'jenkins' | 'azure' | 'travis' | 'both' | 'all' | 'none';
  kubernetes: boolean;
  helmChart: boolean;
  cloudProvider: 'aws' | 'gcp' | 'azure' | 'alibaba' | 'none';
  port?: number; // 添加可选的port属性
}

const DEFAULT_OPTIONS: Partial<ScaffoldOptions> = {
  version: '1.0.0',
  transport: 'both',
  typescript: true,
  installDeps: true,
  docker: false,
  cicd: false,
  cicdPlatform: 'github',
  kubernetes: false,
  helmChart: false,
  cloudProvider: 'none',
  port: 3000
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
      } : {}),
      ...(options.kubernetes ? {
        "k8s:apply": "kubectl apply -f kubernetes/",
        "k8s:delete": "kubectl delete -f kubernetes/",
        "helm:install": `helm install ${options.name} ./helm/${options.name}`,
        "helm:upgrade": `helm upgrade ${options.name} ./helm/${options.name}`,
        "helm:uninstall": `helm uninstall ${options.name}`
      } : {}),
      ...(options.cloudProvider === 'aws' ? {
        "aws:deploy": "aws cloudformation deploy --template-file aws/cloudformation.yml --stack-name " + options.name,
        "aws:package": "aws cloudformation package --template-file aws/sam-template.yml --s3-bucket YOUR_S3_BUCKET --output-template-file aws/packaged.yml",
        "aws:sam:deploy": "aws cloudformation deploy --template-file aws/packaged.yml --stack-name " + options.name + "-sam --capabilities CAPABILITY_IAM",
        "aws:ecr:login": "aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com",
        "aws:ecr:push": "docker tag " + options.name + ":latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/" + options.name + ":latest && docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/" + options.name + ":latest",
        "aws:ecs:update": "aws ecs update-service --cluster " + options.name + "-cluster --service " + options.name + "-service --force-new-deployment"
      } : {}),
      ...(options.cloudProvider === 'gcp' ? {
        "gcp:deploy": "gcloud run deploy --image gcr.io/${options.name}:latest --platform managed --region us-central1 --allow-unauthenticated",
        "gcp:build": "gcloud builds submit --tag gcr.io/${options.name}:latest"
      } : {}),
      ...(options.cloudProvider === 'azure' ? {
        "azure:deploy": "./azure/deploy.sh",
        "azure:deploy:app": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/app-service.json",
        "azure:deploy:function": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/function-app.json",
        "azure:deploy:container": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/container-app.json"
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

  // Create Kubernetes files if requested
  if (options.kubernetes) {
    createKubernetesFiles(basePath, options);
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

  // 如果同时启用了Kubernetes，创建Kubernetes配置文件
  if (options.kubernetes) {
    createKubernetesFiles(basePath, options);
  }

  // 如果同时启用了云服务提供商，创建相应的配置文件
  if (options.cloudProvider !== 'none') {
    switch (options.cloudProvider) {
      case 'aws':
        createAWSFiles(basePath, options);
        break;
      case 'gcp':
        createGCPFiles(basePath, options);
        break;
      case 'azure':
        createAzureFiles(basePath, options);
        break;
      case 'alibaba':
        createAlibabaFiles(basePath, options);
        break;
      // 其他云服务提供商的处理将在未来实现
    }
  }
}

/**
 * 创建Kubernetes配置文件
 */
function createKubernetesFiles(basePath: string, options: ScaffoldOptions) {
  // 创建Kubernetes目录
  const kubernetesDir = path.join(basePath, 'kubernetes');
  fs.mkdirSync(kubernetesDir, { recursive: true });
  
  // 创建命名空间配置
  const namespaceYaml = `apiVersion: v1
kind: Namespace
metadata:
  name: ${options.name}-namespace
  labels:
    app: ${options.name}
    environment: development
`;
  fs.writeFileSync(path.join(kubernetesDir, 'namespace.yaml'), namespaceYaml);
  
  // 创建部署配置
  const deploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${options.name}
  namespace: ${options.name}-namespace
  labels:
    app: ${options.name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${options.name}
  template:
    metadata:
      labels:
        app: ${options.name}
    spec:
      containers:
      - name: ${options.name}
        image: ${options.name}:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`;
  fs.writeFileSync(path.join(kubernetesDir, 'deployment.yaml'), deploymentYaml);
  
  // 创建服务配置
  const serviceYaml = `apiVersion: v1
kind: Service
metadata:
  name: ${options.name}-service
  namespace: ${options.name}-namespace
  labels:
    app: ${options.name}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ${options.name}
`;
  fs.writeFileSync(path.join(kubernetesDir, 'service.yaml'), serviceYaml);
  
  // 创建ConfigMap
  const configMapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${options.name}-config
  namespace: ${options.name}-namespace
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
`;
  fs.writeFileSync(path.join(kubernetesDir, 'configmap.yaml'), configMapYaml);
  
  // 创建HPA (Horizontal Pod Autoscaler)
  const hpaYaml = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${options.name}-hpa
  namespace: ${options.name}-namespace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${options.name}
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
`;
  fs.writeFileSync(path.join(kubernetesDir, 'hpa.yaml'), hpaYaml);
  
  // 创建Ingress配置
  const ingressYaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${options.name}-ingress
  namespace: ${options.name}-namespace
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ${options.name}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${options.name}-service
            port:
              number: 80
`;
  fs.writeFileSync(path.join(kubernetesDir, 'ingress.yaml'), ingressYaml);
  
  // 如果启用了Helm，创建Helm Chart
  if (options.helmChart) {
    createHelmChart(basePath, options);
  }
  
  // 创建Kubernetes说明文档
  const kubernetesReadme = `# Kubernetes部署

本目录包含将${options.name}部署到Kubernetes集群所需的配置文件。

## 配置文件

- \`namespace.yaml\`: 创建专用命名空间
- \`deployment.yaml\`: 定义应用部署配置
- \`service.yaml\`: 创建服务暴露应用
- \`configmap.yaml\`: 环境变量配置
- \`hpa.yaml\`: 水平自动扩展配置
- \`ingress.yaml\`: 入口配置(需要配置域名)

## 部署步骤

1. 确保已安装kubectl并配置访问Kubernetes集群
2. 构建Docker镜像: \`npm run docker:build\`
3. 应用Kubernetes配置: \`npm run k8s:apply\`

或者通过kubectl手动应用:

\`\`\`bash
# 应用所有配置
kubectl apply -f kubernetes/

# 或单独应用各配置
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/hpa.yaml
kubectl apply -f kubernetes/ingress.yaml
\`\`\`

## 查看应用状态

\`\`\`bash
# 查看部署状态
kubectl get deployments -n ${options.name}-namespace

# 查看Pod状态
kubectl get pods -n ${options.name}-namespace

# 查看服务
kubectl get services -n ${options.name}-namespace

# 查看自动扩展配置
kubectl get hpa -n ${options.name}-namespace
\`\`\`

## 测试应用

\`\`\`bash
# 端口转发测试
kubectl port-forward svc/${options.name}-service 8080:80 -n ${options.name}-namespace

# 然后在浏览器访问: http://localhost:8080
\`\`\`

## 删除部署

\`\`\`bash
# 使用npm脚本
npm run k8s:delete

# 或手动删除
kubectl delete -f kubernetes/
\`\`\`

## 注意事项

- 部署前请修改\`ingress.yaml\`中的host值为您自己的域名
- 根据环境需要调整\`deployment.yaml\`中的资源限制和请求
- 如需持久化数据，请添加PersistentVolume和PersistentVolumeClaim配置
${options.helmChart ? '\n- 该项目也提供了Helm Chart，可使用`npm run helm:install`快速部署' : ''}
`;
  
  fs.writeFileSync(path.join(kubernetesDir, 'README.md'), kubernetesReadme);
}

/**
 * 创建Helm Chart配置
 */
function createHelmChart(basePath: string, options: ScaffoldOptions) {
  // 创建Helm目录结构
  const helmBaseDir = path.join(basePath, 'helm');
  const chartDir = path.join(helmBaseDir, options.name);
  const templatesDir = path.join(chartDir, 'templates');
  
  fs.mkdirSync(helmBaseDir, { recursive: true });
  fs.mkdirSync(chartDir, { recursive: true });
  fs.mkdirSync(templatesDir, { recursive: true });
  
  // 创建Chart.yaml
  const chartYaml = `apiVersion: v2
name: ${options.name}
description: ${options.description || `A Helm chart for ${options.name} MCP server`}
type: application
version: 0.1.0
appVersion: "${options.version}"
`;
  fs.writeFileSync(path.join(chartDir, 'Chart.yaml'), chartYaml);
  
  // 创建values.yaml
  const valuesYaml = `# 默认配置值
replicaCount: 1

image:
  repository: ${options.name}
  tag: latest
  pullPolicy: IfNotPresent

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: false
  name: ""

podSecurityContext: {}

securityContext: {}

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: ${options.name}.example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
`;
  fs.writeFileSync(path.join(chartDir, 'values.yaml'), valuesYaml);
  
  // 创建NOTES.txt
  const notesContent = `1. 获取应用URL:
{{- if .Values.ingress.enabled }}
{{- range $host := .Values.ingress.hosts }}
  {{- range .paths }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ $host.host }}{{ .path }}
  {{- end }}
{{- end }}
{{- else if contains "NodePort" .Values.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "mcp-server.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.service.type }}
  NOTE: 需要几分钟才能分配外部IP
  export SERVICE_IP=$(kubectl get svc --namespace {{ .Release.Namespace }} {{ include "mcp-server.fullname" . }} --template "{{"{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}"}}")
  echo http://$SERVICE_IP:{{ .Values.service.port }}
{{- else if contains "ClusterIP" .Values.service.type }}
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "mcp-server.name" . }},app.kubernetes.io/instance={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace {{ .Release.Namespace }} $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "访问应用，运行如下命令:"
  kubectl --namespace {{ .Release.Namespace }} port-forward $POD_NAME 8080:$CONTAINER_PORT
  在浏览器访问 http://127.0.0.1:8080
{{- end }}
`;
  fs.writeFileSync(path.join(chartDir, 'templates', 'NOTES.txt'), notesContent);
  
  // 创建_helpers.tpl
  const helpersTpl = `{{/*
Expand the name of the chart.
*/}}
{{- define "mcp-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mcp-server.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mcp-server.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mcp-server.labels" -}}
helm.sh/chart: {{ include "mcp-server.chart" . }}
{{ include "mcp-server.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mcp-server.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mcp-server.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
`;
  fs.writeFileSync(path.join(chartDir, 'templates', '_helpers.tpl'), helpersTpl);
  
  // 创建部署模板
  const deploymentTpl = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mcp-server.fullname" . }}
  labels:
    {{- include "mcp-server.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "mcp-server.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mcp-server.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.service.targetPort }}
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.service.targetPort }}
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            {{- range $key, $value := .Values.env }}
            - name: {{ $key }}
              value: {{ $value | quote }}
            {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
`;
  fs.writeFileSync(path.join(templatesDir, 'deployment.yaml'), deploymentTpl);
  
  // 创建服务模板
  const serviceTpl = `apiVersion: v1
kind: Service
metadata:
  name: {{ include "mcp-server.fullname" . }}
  labels:
    {{- include "mcp-server.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
  selector:
    {{- include "mcp-server.selectorLabels" . | nindent 4 }}
`;
  fs.writeFileSync(path.join(templatesDir, 'service.yaml'), serviceTpl);
  
  // 创建Ingress模板
  const ingressTpl = `{{- if .Values.ingress.enabled -}}
{{- $fullName := include "mcp-server.fullname" . -}}
{{- $svcPort := .Values.service.port -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ $fullName }}
  labels:
    {{- include "mcp-server.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ $fullName }}
                port:
                  number: {{ $svcPort }}
          {{- end }}
    {{- end }}
{{- end }}
`;
  fs.writeFileSync(path.join(templatesDir, 'ingress.yaml'), ingressTpl);
  
  // 创建HPA模板
  const hpaTpl = `{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "mcp-server.fullname" . }}
  labels:
    {{- include "mcp-server.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "mcp-server.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
{{- end }}
`;
  fs.writeFileSync(path.join(templatesDir, 'hpa.yaml'), hpaTpl);
  
  // 创建ConfigMap模板
  const configMapTpl = `apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "mcp-server.fullname" . }}-config
  labels:
    {{- include "mcp-server.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.env }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
`;
  fs.writeFileSync(path.join(templatesDir, 'configmap.yaml'), configMapTpl);
  
  // 创建Helm文档
  const helmReadme = `# ${options.name} Helm Chart

这个Helm Chart用于在Kubernetes集群上部署${options.name} MCP服务器。

## 前提条件

- Kubernetes 1.19+
- Helm 3.2.0+

## 安装Chart

\`\`\`bash
# 使用npm脚本
npm run helm:install

# 或使用helm命令
helm install ${options.name} ./helm/${options.name}
\`\`\`

## 卸载Chart

\`\`\`bash
# 使用npm脚本
npm run helm:uninstall

# 或使用helm命令
helm uninstall ${options.name}
\`\`\`

## 配置参数

| 参数                                  | 描述                                | 默认值                           |
|---------------------------------------|-------------------------------------|----------------------------------|
| \`replicaCount\`                      | 副本数量                            | \`1\`                             |
| \`image.repository\`                  | 镜像仓库                            | \`${options.name}\`               |
| \`image.tag\`                         | 镜像标签                            | \`latest\`                        |
| \`image.pullPolicy\`                  | 镜像拉取策略                        | \`IfNotPresent\`                  |
| \`service.type\`                      | Kubernetes服务类型                  | \`ClusterIP\`                     |
| \`service.port\`                      | 服务端口                            | \`80\`                            |
| \`service.targetPort\`                | 目标端口                            | \`3000\`                          |
| \`ingress.enabled\`                   | 是否启用Ingress                     | \`true\`                          |
| \`ingress.hosts\`                     | Ingress主机配置                     | \`[{host: "${options.name}.example.com", paths: [{path: "/", pathType: "Prefix"}]}]\` |
| \`resources.limits.cpu\`              | CPU资源限制                         | \`500m\`                          |
| \`resources.limits.memory\`           | 内存资源限制                        | \`512Mi\`                         |
| \`resources.requests.cpu\`            | CPU资源请求                         | \`100m\`                          |
| \`resources.requests.memory\`         | 内存资源请求                        | \`128Mi\`                         |
| \`autoscaling.enabled\`               | 是否启用自动扩展                    | \`true\`                          |
| \`autoscaling.minReplicas\`           | 最小副本数                          | \`1\`                             |
| \`autoscaling.maxReplicas\`           | 最大副本数                          | \`5\`                             |
| \`autoscaling.targetCPUUtilizationPercentage\` | 目标CPU使用率             | \`80\`                            |
| \`env\`                               | 环境变量                            | \`{NODE_ENV: "production", PORT: "3000", LOG_LEVEL: "info"}\` |

## 自定义配置

您可以通过创建自己的values.yaml文件来覆盖默认配置：

\`\`\`bash
helm install ${options.name} ./helm/${options.name} -f my-values.yaml
\`\`\`

示例自定义values.yaml:

\`\`\`yaml
replicaCount: 2

image:
  repository: myregistry/${options.name}
  tag: v1.0.0

service:
  type: LoadBalancer

ingress:
  enabled: true
  hosts:
    - host: api.mycompany.com
      paths:
        - path: /mcp
          pathType: Prefix

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: debug
  API_KEY: "my-api-key"
\`\`\`
`;
  
  fs.writeFileSync(path.join(helmBaseDir, 'README.md'), helmReadme);
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

  if (options.cicdPlatform === 'jenkins' || options.cicdPlatform === 'all') {
    createJenkins(basePath, options);
  }
  
  if (options.cicdPlatform === 'azure' || options.cicdPlatform === 'all') {
    createAzureDevOps(basePath, options);
  }
  
  if (options.cicdPlatform === 'travis' || options.cicdPlatform === 'all') {
    createTravisCI(basePath, options);
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
 * 创建Jenkins配置文件
 */
function createJenkins(basePath: string, options: ScaffoldOptions) {
  // 创建Jenkins目录
  fs.mkdirSync(path.join(basePath, 'jenkins'), { recursive: true });
  
  // 创建Jenkinsfile
  const jenkinsfileContent = `pipeline {
    agent {
        docker {
            image 'node:18.15.0'
            args '-p 3000:3000'
        }
    }
    
    environment {
        CI = 'true'
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }${options.docker ? `
        
        stage('Docker Build') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker build -t ${options.name}:$BUILD_NUMBER .'
                sh 'docker tag ${options.name}:$BUILD_NUMBER ${options.name}:latest'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to staging environment'
                // Add deployment steps here
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'master'
            }
            steps {
                echo 'Deploying to production environment'
                // Add production deployment steps here
            }
        }` : ''}
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}`;

  fs.writeFileSync(path.join(basePath, 'Jenkinsfile'), jenkinsfileContent);
  
  // 创建Jenkins配置脚本
  const jenkinsConfigScript = `#!/bin/bash
# Jenkins 配置脚本

# 设置Jenkins URL和API令牌
JENKINS_URL="http://jenkins:8080"
JENKINS_API_TOKEN="YOUR_API_TOKEN"

# 设置Jenkins作业名称
JOB_NAME="${options.name}"

# 创建Jenkins作业配置XML
cat > jenkins_job_config.xml << EOF
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.42">
  <description>${options.description}</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <hudson.triggers.SCMTrigger>
          <spec>H/15 * * * *</spec>
          <ignorePostCommitHooks>false</ignorePostCommitHooks>
        </hudson.triggers.SCMTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.93">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@4.8.0">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>YOUR_GIT_REPO_URL</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF

echo "Jenkins作业配置文件已创建: jenkins_job_config.xml"
echo "要创建Jenkins作业，运行:"
echo "curl -X POST -H 'Content-Type: application/xml' -d @jenkins_job_config.xml '$JENKINS_URL/createItem?name=$JOB_NAME' --user user:$JENKINS_API_TOKEN"
`;

  fs.writeFileSync(path.join(basePath, 'jenkins', 'setup_jenkins_job.sh'), jenkinsConfigScript);
  fs.chmodSync(path.join(basePath, 'jenkins', 'setup_jenkins_job.sh'), '755');
  
  // 创建多分支流水线配置
  if (options.docker) {
    const multiBranchConfig = `#!/bin/bash
# Jenkins 多分支流水线配置脚本

# 设置Jenkins URL和API令牌
JENKINS_URL="http://jenkins:8080"
JENKINS_API_TOKEN="YOUR_API_TOKEN"

# 设置Jenkins多分支作业名称
JOB_NAME="${options.name}-multibranch"

# 创建Jenkins多分支作业配置XML
cat > jenkins_multibranch_config.xml << EOF
<?xml version='1.1' encoding='UTF-8'?>
<org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject plugin="workflow-multibranch@2.26">
  <actions/>
  <description>${options.description} - 多分支流水线</description>
  <properties>
    <org.jenkinsci.plugins.pipeline.modeldefinition.config.FolderConfig plugin="pipeline-model-definition@1.9.2">
      <dockerLabel></dockerLabel>
      <registry plugin="docker-commons@1.17"/>
    </org.jenkinsci.plugins.pipeline.modeldefinition.config.FolderConfig>
  </properties>
  <folderViews class="jenkins.branch.MultiBranchProjectViewHolder" plugin="branch-api@2.6.5">
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
  </folderViews>
  <healthMetrics/>
  <icon class="jenkins.branch.MetadataActionFolderIcon" plugin="branch-api@2.6.5">
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
  </icon>
  <orphanedItemStrategy class="com.cloudbees.hudson.plugins.folder.computed.DefaultOrphanedItemStrategy" plugin="cloudbees-folder@6.16">
    <pruneDeadBranches>true</pruneDeadBranches>
    <daysToKeep>-1</daysToKeep>
    <numToKeep>-1</numToKeep>
  </orphanedItemStrategy>
  <triggers>
    <com.cloudbees.hudson.plugins.folder.computed.PeriodicFolderTrigger plugin="cloudbees-folder@6.16">
      <spec>H/30 * * * *</spec>
      <interval>1800000</interval>
    </com.cloudbees.hudson.plugins.folder.computed.PeriodicFolderTrigger>
  </triggers>
  <sources class="jenkins.branch.MultiBranchProject\$BranchSourceList" plugin="branch-api@2.6.5">
    <data>
      <jenkins.branch.BranchSource>
        <source class="jenkins.plugins.git.GitSCMSource" plugin="git@4.8.0">
          <id>YOUR_GIT_REPO_ID</id>
          <remote>YOUR_GIT_REPO_URL</remote>
          <credentialsId></credentialsId>
          <traits>
            <jenkins.plugins.git.traits.BranchDiscoveryTrait/>
            <jenkins.plugins.git.traits.TagDiscoveryTrait/>
          </traits>
        </source>
        <strategy class="jenkins.branch.DefaultBranchPropertyStrategy">
          <properties class="empty-list"/>
        </strategy>
      </jenkins.branch.BranchSource>
    </data>
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
  </sources>
  <factory class="org.jenkinsci.plugins.workflow.multibranch.WorkflowBranchProjectFactory">
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
    <scriptPath>Jenkinsfile</scriptPath>
  </factory>
</org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject>
EOF

echo "Jenkins多分支流水线配置文件已创建: jenkins_multibranch_config.xml"
echo "要创建Jenkins多分支作业，运行:"
echo "curl -X POST -H 'Content-Type: application/xml' -d @jenkins_multibranch_config.xml '$JENKINS_URL/createItem?name=$JOB_NAME' --user user:$JENKINS_API_TOKEN"
`;

    fs.writeFileSync(path.join(basePath, 'jenkins', 'setup_multibranch_pipeline.sh'), multiBranchConfig);
    fs.chmodSync(path.join(basePath, 'jenkins', 'setup_multibranch_pipeline.sh'), '755');
  }
  
  // 创建Jenkins文档
  const jenkinsDocs = `# Jenkins CI/CD 配置说明

本项目包含Jenkins CI/CD流水线配置，可自动化执行构建、测试${options.docker ? '、容器化和部署' : ''}过程。

## 流水线配置

Jenkinsfile定义了完整的CI/CD流水线，包括以下阶段：

1. **依赖安装**: 安装项目所需的npm依赖
2. **测试**: 运行自动化测试
3. **构建**: 编译项目代码${options.docker ? '\n4. **Docker构建**: 创建Docker镜像\n5. **部署**: 部署到Staging和Production环境' : ''}

## 设置Jenkins

### 前提条件

1. 安装Jenkins服务器(版本2.0+)
2. 安装以下Jenkins插件:
   - Pipeline
   - Git Integration
   - Docker Pipeline${options.docker ? '\n   - Docker Build and Publish' : ''}
   - Blue Ocean (可选，提供更好的UI体验)

### 配置Jenkins作业

有两种方式配置Jenkins:

#### 1. 手动配置

1. 在Jenkins创建新的Pipeline作业
2. 配置Git仓库源
3. 设置Jenkinsfile路径为仓库根目录下的'Jenkinsfile'

#### 2. 使用配置脚本

1. 修改\`jenkins/setup_jenkins_job.sh\`中的变量:
   - JENKINS_URL: Jenkins服务器URL
   - JENKINS_API_TOKEN: Jenkins API令牌
   - 在XML配置中更新Git仓库URL
2. 运行脚本创建Jenkins作业

${options.docker ? `
#### 多分支流水线配置(推荐)

对于需要支持多分支CI/CD的项目:

1. 修改\`jenkins/setup_multibranch_pipeline.sh\`中的变量
2. 运行脚本创建多分支Pipeline作业
` : ''}

## 环境变量配置

在Jenkins中设置以下环境变量:

1. 基本环境变量:
   - NODE_ENV: 运行环境(development, production等) 
   
${options.docker ? `2. Docker相关变量:
   - DOCKER_REGISTRY: Docker镜像仓库地址
   - DOCKER_REGISTRY_CREDENTIALS: Docker仓库凭证ID` : ''}

## 最佳实践

1. 使用语义化版本管理代码
2. 为每个功能创建独立分支
3. 使用"master"分支作为生产版本
4. 使用"main"或"develop"分支作为开发/预发布版本
5. 配置受保护分支和合并请求规则
6. 定期清理旧的构建产物

## 故障排除

如遇构建失败:

1. 检查Jenkins日志详情
2. 验证Jenkinsfile语法是否正确
3. 确保Jenkins用户有足够权限
4. 检查Docker守护进程是否可访问${options.docker ? '\n5. 验证Docker镜像仓库凭证' : ''}

## 参考资源

- [Jenkins Pipeline语法](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins与Git集成](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/)
- [Jenkins与Docker集成](https://www.jenkins.io/doc/book/pipeline/docker/)
`;

  fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(basePath, 'docs', 'jenkins.md'), jenkinsDocs);
}

/**
 * 创建Azure DevOps Pipeline配置文件
 */
function createAzureDevOps(basePath: string, options: ScaffoldOptions) {
  // 创建Azure Pipelines目录
  fs.mkdirSync(path.join(basePath, 'azure-pipelines'), { recursive: true });
  
  // 创建主要的azure-pipelines.yml文件
  const pipelineYml = `# Node.js
# Build and test Node.js project with npm.
# Add steps that analyze code, save build artifacts, deploy, and more:
# https://docs.microsoft.com/azure/devops/pipelines/languages/javascript

trigger:
  - main
  - master
  
pool:
  vmImage: 'ubuntu-latest'

strategy:
  matrix:
    node_16_x:
      node_version: '16.x'
    node_18_x:
      node_version: '18.x'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '\$(node_version)'
  displayName: 'Install Node.js \$(node_version)'

- script: |
    npm ci
  displayName: 'Install dependencies'

- script: |
    npm run build
  displayName: 'Build'

- script: |
    npm test
  displayName: 'Run tests'${options.docker ? `

- task: Docker@2
  condition: and(succeeded(), eq(variables['node_version'], '18.x'), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  inputs:
    containerRegistry: 'YourRegistry'
    repository: '${options.name}'
    command: 'buildAndPush'
    Dockerfile: '**/Dockerfile'
    tags: |
      \$(Build.BuildNumber)
      latest
  displayName: 'Build and push Docker image'` : ''}
`;

  fs.writeFileSync(path.join(basePath, 'azure-pipelines.yml'), pipelineYml);
  
  // 创建环境特定的pipeline文件
  if (options.docker) {
    // 创建staging环境pipeline
    const stagingPipeline = `# Staging deployment pipeline
trigger: none
pr: none

# Manual trigger from main pipeline
resources:
  pipelines:
  - pipeline: mainPipeline
    source: ${options.name}
    trigger: 
      branches:
        include:
        - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  environment: 'staging'

steps:
- task: DownloadPipelineArtifact@2
  inputs:
    buildType: 'current'
    artifactName: 'dist'
    targetPath: '$(Pipeline.Workspace)/dist'
    
- task: AzureWebApp@1
  inputs:
    azureSubscription: '\$(AZURE_SUBSCRIPTION)'
    appType: 'webAppContainer'
    appName: '${options.name}-staging'
    containers: '${options.name}:\$(Build.BuildNumber)'
  displayName: 'Deploy to Azure Web App - Staging'
`;

    fs.writeFileSync(path.join(basePath, 'azure-pipelines', 'staging.yml'), stagingPipeline);

    // 创建production环境pipeline
    const productionPipeline = `# Production deployment pipeline
trigger: none
pr: none

# Manual trigger
resources:
  pipelines:
  - pipeline: mainPipeline
    source: ${options.name}
    trigger: none

pool:
  vmImage: 'ubuntu-latest'

variables:
  environment: 'production'

steps:
- task: DownloadPipelineArtifact@2
  inputs:
    buildType: 'current'
    artifactName: 'dist'
    targetPath: '$(Pipeline.Workspace)/dist'
    
- task: AzureWebApp@1
  inputs:
    azureSubscription: '\$(AZURE_SUBSCRIPTION)'
    appType: 'webAppContainer'
    appName: '${options.name}-production'
    containers: '${options.name}:\$(Build.BuildNumber)'
    deploymentMethod: 'runFromPackage'
  displayName: 'Deploy to Azure Web App - Production'
`;

    fs.writeFileSync(path.join(basePath, 'azure-pipelines', 'production.yml'), productionPipeline);
  }
  
  // 创建变量组配置文件
  const variablesTemplate = `# 变量组配置模板
# 在Azure DevOps中创建变量组并导入此文件或手动设置这些变量

variables:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: 3000${options.docker ? `
  - name: DOCKER_REGISTRY
    value: yourregistry.azurecr.io
  - name: AZURE_SUBSCRIPTION
    value: Your-Azure-Subscription-Name` : ''}
`;

  fs.writeFileSync(path.join(basePath, 'azure-pipelines', 'variables.yml'), variablesTemplate);
  
  // 创建Azure DevOps文档
  const azureDevOpsDocs = `# Azure DevOps Pipeline 配置说明

本项目包含Azure DevOps Pipeline配置，可自动化执行构建、测试${options.docker ? '、容器化和部署' : ''}过程。

## Pipeline配置

项目根目录下的\`azure-pipelines.yml\`定义了主要的CI/CD流水线，包括以下阶段：

1. **构建**: 编译项目代码
2. **测试**: 运行自动化测试${options.docker ? `
3. **Docker构建**: 构建Docker镜像
4. **部署**: 部署到不同环境` : ''}

## 设置Azure DevOps

### 前提条件

1. 在Azure DevOps中创建一个项目
2. 将代码仓库连接到Azure DevOps
3. ${options.docker ? '设置Azure Container Registry或其他Docker仓库' : '配置适当的构建环境'}

### 配置Pipeline

1. 在Azure DevOps中，导航到Pipelines > New Pipeline
2. 选择您的代码仓库
3. 选择"Existing Azure Pipelines YAML file"选项
4. 选择\`azure-pipelines.yml\`文件
5. 检查配置并点击"Run"

${options.docker ? `
### 环境配置

本项目包含多个环境的Pipeline配置:

1. **azure-pipelines.yml**: 主要构建和测试Pipeline
2. **azure-pipelines/staging.yml**: Staging环境部署Pipeline
3. **azure-pipelines/production.yml**: Production环境部署Pipeline

要配置这些环境:

1. 在Azure DevOps中创建每个环境的Pipeline
2. 设置适当的触发条件和审批流程
3. 确保正确配置Azure资源和服务连接
` : ''}

## 变量配置

在Azure DevOps中，您需要设置以下变量:

1. 在项目设置中创建变量组(使用\`azure-pipelines/variables.yml\`作为参考)
2. 设置以下变量:
   - \`NODE_ENV\`: 运行环境(development, production等)
   - \`PORT\`: 应用程序端口${options.docker ? `
   - \`DOCKER_REGISTRY\`: Docker镜像仓库地址
   - \`AZURE_SUBSCRIPTION\`: Azure订阅名称` : ''}

## 最佳实践

1. 使用分支策略保护主分支
2. 设置适当的审批流程控制部署
3. 使用变量组管理不同环境的配置
4. 利用Azure DevOps的环境功能跟踪部署
5. 配置通知和警报监控构建和部署状态

## 故障排除

如遇构建失败:

1. 检查Azure DevOps日志详情
2. 验证服务连接和凭证是否正确
3. 确保Docker配置正确(如果使用)
4. 检查节点版本和依赖是否兼容

## 参考资源

- [Azure Pipelines YAML架构](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema)
- [Azure DevOps变量和模板](https://docs.microsoft.com/azure/devops/pipelines/process/variables)
- [Azure DevOps环境和审批](https://docs.microsoft.com/azure/devops/pipelines/process/environments)
${options.docker ? '- [Azure DevOps与Docker集成](https://docs.microsoft.com/azure/devops/pipelines/ecosystems/containers/build-image)' : ''}
`;

  fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(basePath, 'docs', 'azure-devops.md'), azureDevOpsDocs);
}

/**
 * 创建Travis CI配置文件
 */
function createTravisCI(basePath: string, options: ScaffoldOptions) {
  // 创建Travis CI配置文件
  const travisConfig = `language: node_js
node_js:
  - "16"
  - "18"
  - "lts/*"

cache:
  directories:
    - node_modules

# 安装依赖
install:
  - npm ci

# 运行测试
script:
  - npm run build
  - npm test${options.docker ? `

# 如果构建成功且是主分支则构建Docker镜像
after_success:
  - if [ "$TRAVIS_BRANCH" = "main" ] && [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
      echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin;
      docker build -t ${options.name}:$TRAVIS_BUILD_NUMBER .;
      docker tag ${options.name}:$TRAVIS_BUILD_NUMBER ${options.name}:latest;
      docker push ${options.name}:$TRAVIS_BUILD_NUMBER;
      docker push ${options.name}:latest;
    fi` : ''}

# 指定哪些分支触发构建
branches:
  only:
    - main
    - master
    - /^v\\d+\\.\\d+(\\.\\d+)?(-\\S*)?$/

notifications:
  email:
    on_success: change
    on_failure: always
`;

  fs.writeFileSync(path.join(basePath, '.travis.yml'), travisConfig);
  
  // 如果启用了Docker，创建Travis CI部署配置
  if (options.docker) {
    // 创建部署脚本
    const deployScript = `#!/bin/bash
# Travis CI部署脚本

set -e

# 环境变量
DEPLOY_ENV="$1"
if [ -z "$DEPLOY_ENV" ]; then
  echo "请指定部署环境: staging 或 production"
  exit 1
fi

# 当前版本
VERSION=$TRAVIS_BUILD_NUMBER
if [ -z "$VERSION" ]; then
  VERSION=$(date +%Y%m%d%H%M%S)
fi

echo "开始部署 ${options.name} 到 $DEPLOY_ENV 环境..."

# 根据环境执行不同部署逻辑
if [ "$DEPLOY_ENV" = "production" ]; then
  echo "正在部署到生产环境..."
  # 在这里添加生产环境部署命令
  # 例如: ssh deploy@production-server './deploy.sh ${options.name} $VERSION'
elif [ "$DEPLOY_ENV" = "staging" ]; then
  echo "正在部署到临时测试环境..."
  # 在这里添加测试环境部署命令
  # 例如: ssh deploy@staging-server './deploy.sh ${options.name} $VERSION'
else
  echo "未知的部署环境: $DEPLOY_ENV"
  exit 1
fi

echo "部署完成!"
exit 0
`;

    // 创建部署目录
    fs.mkdirSync(path.join(basePath, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(basePath, 'scripts', 'deploy.sh'), deployScript);
    fs.chmodSync(path.join(basePath, 'scripts', 'deploy.sh'), '755');
    
    // 为测试和生产环境创建Travis CI配置
    const travisStaging = `language: node_js
node_js:
  - "18"

cache:
  directories:
    - node_modules

# 安装依赖
install:
  - npm ci

# 构建和推送Docker镜像
script:
  - npm run build
  - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  - docker build -t ${options.name}:staging-$TRAVIS_BUILD_NUMBER .
  - docker tag ${options.name}:staging-$TRAVIS_BUILD_NUMBER ${options.name}:staging
  - docker push ${options.name}:staging-$TRAVIS_BUILD_NUMBER
  - docker push ${options.name}:staging

# 部署到测试环境
deploy:
  provider: script
  script: bash scripts/deploy.sh staging
  on:
    branch: develop
`;

    const travisProduction = `language: node_js
node_js:
  - "18"

cache:
  directories:
    - node_modules

# 安装依赖
install:
  - npm ci

# 构建和推送Docker镜像
script:
  - npm run build
  - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  - docker build -t ${options.name}:$TRAVIS_TAG .
  - docker tag ${options.name}:$TRAVIS_TAG ${options.name}:latest
  - docker push ${options.name}:$TRAVIS_TAG
  - docker push ${options.name}:latest

# 部署到生产环境
deploy:
  provider: script
  script: bash scripts/deploy.sh production
  on:
    tags: true
`;

    fs.mkdirSync(path.join(basePath, 'travis'), { recursive: true });
    fs.writeFileSync(path.join(basePath, 'travis', 'staging.yml'), travisStaging);
    fs.writeFileSync(path.join(basePath, 'travis', 'production.yml'), travisProduction);
  }
  
  // 创建Travis CI文档
  const travisDocs = `# Travis CI 配置说明

本项目包含Travis CI配置，用于自动化构建、测试${options.docker ? '和部署' : ''}过程。

## 配置文件

主要的Travis CI配置文件位于项目根目录下的\`.travis.yml\`，定义了完整的CI流程，包括：

1. **环境**：使用Node.js环境，测试多个版本
2. **缓存**：配置node_modules缓存加速构建
3. **构建**：安装依赖并运行构建命令
4. **测试**：运行自动化测试套件${options.docker ? `
5. **Docker**：构建并推送Docker镜像（仅限主分支）
6. **部署**：根据分支或标签触发部署` : ''}

## 使用Travis CI

### 前提条件

1. 在GitHub上托管项目代码
2. 在[travis-ci.com](https://travis-ci.com)上注册账户并连接GitHub
3. 为项目启用Travis CI

### 配置步骤

1. 将\`.travis.yml\`添加到项目根目录
2. 在Travis CI仪表板上启用项目${options.docker ? `
3. 添加以下环境变量到Travis CI项目设置中：
   - \`DOCKER_USERNAME\`：Docker Hub用户名
   - \`DOCKER_PASSWORD\`：Docker Hub密码或访问令牌` : ''}

${options.docker ? `
### 多环境部署

项目包含用于不同环境的配置文件：

1. **travis/staging.yml**：用于部署到临时测试环境（develop分支）
2. **travis/production.yml**：用于部署到生产环境（当创建git标签时）

要使用这些配置：

1. 复制所需环境的配置到根目录的\`.travis.yml\`
2. 在Travis CI仪表板上触发构建

### 部署脚本

\`scripts/deploy.sh\`包含部署逻辑：

\`\`\`bash
# 部署到临时测试环境
./scripts/deploy.sh staging

# 部署到生产环境
./scripts/deploy.sh production
\`\`\`

根据需要修改此脚本以适应您的部署目标。
` : ''}

## 最佳实践

1. 使用语义化版本标签触发生产部署
2. 保持测试覆盖率高以确保CI的有效性
3. 监控构建状态和性能${options.docker ? `
4. 使用环境变量存储敏感信息（不要硬编码到配置文件）
5. 定期清理旧的Docker镜像` : ''}

## 故障排除

如果构建失败：

1. 检查Travis CI日志以获取详细错误信息
2. 验证当前的Node.js版本兼容性
3. 确保所有依赖都正确列出${options.docker ? `
4. 检查Docker凭据是否正确设置
5. 验证Docker镜像构建和推送权限` : ''}

## 参考资源

- [Travis CI文档](https://docs.travis-ci.com/)
- [Node.js与Travis CI](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/)${options.docker ? `
- [Travis CI与Docker集成](https://docs.travis-ci.com/user/docker/)
- [Travis CI部署指南](https://docs.travis-ci.com/user/deployment/)` : ''}
`;

  fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(basePath, 'docs', 'travis-ci.md'), travisDocs);
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
 * 创建AWS相关配置文件
 */
export function createAWSFiles(basePath: string, options: ScaffoldOptions) {
  // 创建AWS目录
  const awsDir = path.join(basePath, 'aws');
  fs.mkdirSync(awsDir, { recursive: true });
  
  // 创建CloudFormation模板
  const cloudFormationTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template for ${options.name} MCP server

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - staging
      - prod
    Description: Environment name

  ContainerPort:
    Type: Number
    Default: 3000
    Description: Port the container exposes

  DesiredCount:
    Type: Number
    Default: 1
    Description: How many instances of the application to run

  MaxCount:
    Type: Number
    Default: 5
    Description: Maximum number of instances to run

  ContainerMemory:
    Type: Number
    Default: 512
    Description: Memory to allocate to the container in MiB

  ContainerCpu:
    Type: Number
    Default: 256
    Description: CPU units to allocate to the container

Resources:
  # VPC resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub \${AWS::StackName}-vpc

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub \${AWS::StackName}-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub \${AWS::StackName}-public-subnet-2

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub \${AWS::StackName}-igw

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub \${AWS::StackName}-public-routes

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # ECR Repository
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub \${AWS::StackName}-repo
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Keep only the last 5 images",
                "selection": {
                  "tagStatus": "any",
                  "countType": "imageCountMoreThan",
                  "countNumber": 5
                },
                "action": {
                  "type": "expire"
                }
              }
            ]
          }

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub \${AWS::StackName}-cluster

  # ECS Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub \${AWS::StackName}-task
      Cpu: !Ref ContainerCpu
      Memory: !Ref ContainerMemory
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: !Sub \${AWS::StackName}-container
          Image: !Sub \${AWS::AccountId}.dkr.ecr.\${AWS::Region}.amazonaws.com/\${ECRRepository}:latest
          PortMappings:
            - ContainerPort: !Ref ContainerPort
          Environment:
            - Name: NODE_ENV
              Value: !Ref Environment
            - Name: PORT
              Value: !Ref ContainerPort
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref CloudWatchLogsGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs

  # CloudWatch Logs Group
  CloudWatchLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /ecs/\${AWS::StackName}
      RetentionInDays: 14

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub \${AWS::StackName}-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DeploymentConfiguration:
        MinimumHealthyPercent: 100
        MaximumPercent: 200
      DesiredCount: !Ref DesiredCount
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: ENABLED
          SecurityGroups:
            - !Ref ContainerSecurityGroup
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
      LoadBalancers:
        - ContainerName: !Sub \${AWS::StackName}-container
          ContainerPort: !Ref ContainerPort
          TargetGroupArn: !Ref TargetGroup

  # Auto Scaling
  ScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: !Ref MaxCount
      MinCapacity: !Ref DesiredCount
      ResourceId: !Join 
        - /
        - - service
          - !Ref ECSCluster
          - !GetAtt ECSService.Name
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs
      RoleARN: !GetAtt AutoScalingRole.Arn

  ScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub \${AWS::StackName}-scaling-policy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
        TargetValue: 70.0

  # Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub \${AWS::StackName}-alb
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub \${AWS::StackName}-tg
      Port: !Ref ContainerPort
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 3
      UnhealthyThresholdCount: 3

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Control access to the ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  ContainerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Control access to the container
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref ContainerPort
          ToPort: !Ref ContainerPort
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup

  # IAM Roles
  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  AutoScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt LoadBalancer.DNSName
    Export:
      Name: !Sub \${AWS::StackName}-LoadBalancerDNS

  ECRRepositoryURI:
    Description: URI of the ECR repository
    Value: !Sub \${AWS::AccountId}.dkr.ecr.\${AWS::Region}.amazonaws.com/\${ECRRepository}
    Export:
      Name: !Sub \${AWS::StackName}-ECRRepositoryURI

  ECSClusterName:
    Description: Name of the ECS cluster
    Value: !Ref ECSCluster
    Export:
      Name: !Sub \${AWS::StackName}-ECSClusterName

  ECSServiceName:
    Description: Name of the ECS service
    Value: !GetAtt ECSService.Name
    Export:
      Name: !Sub \${AWS::StackName}-ECSServiceName
`;
  fs.writeFileSync(path.join(awsDir, 'cloudformation.yml'), cloudFormationTemplate);
  
  // 创建AWS SAM模板
  const samTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: SAM template for ${options.name} MCP server

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs16.x
    MemorySize: 256
    Environment:
      Variables:
        NODE_ENV: production

Resources:
  MCPServerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: ${options.name}-function
      Handler: dist/lambda.handler
      CodeUri: ../
      Description: MCP server function for ${options.description || options.name}
      Policies:
        - AWSLambdaExecute
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: !Sub "arn:aws:logs:\${AWS::Region}:\${AWS::AccountId}:*"
      Events:
        HttpApiEvent:
          Type: HttpApi
          Properties:
            Path: /api/{proxy+}
            Method: ANY
      Tags:
        Service: ${options.name}
        Environment: production

  MCPServerApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: api
      Tags:
        Service: ${options.name}
        Environment: production

Outputs:
  MCPServerFunction:
    Description: Lambda Function ARN
    Value: !GetAtt MCPServerFunction.Arn

  MCPServerApi:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${MCPServerApi}.execute-api.\${AWS::Region}.amazonaws.com/api/"
`;
  fs.writeFileSync(path.join(awsDir, 'sam-template.yml'), samTemplate);
  
  // 创建Lambda处理程序
  const lambdaHandler = `import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createServer } from '../src/server';

// 初始化MCP服务器
const mcpServer = createServer();

/**
 * Lambda函数处理器，用于处理API Gateway请求
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Request event:', JSON.stringify(event));
    
    // 构建请求对象
    const request = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : {}
    };
    
    // 处理MCP请求
    const response = await mcpServer.handleRequest(request);
    
    // 返回响应
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};`;
  fs.writeFileSync(path.join(basePath, 'src', 'lambda.ts'), lambdaHandler);
  
  // 创建部署脚本
  const deployScript = `#!/bin/bash
# AWS部署脚本
# 用法: ./aws-deploy.sh [环境]

ENV=\${1:-dev}
STACK_NAME="${options.name}-\${ENV}"
ECR_REPO_NAME="\${STACK_NAME}-repo"
AWS_REGION="\${AWS_REGION:-us-east-1}"
AWS_PROFILE="\${AWS_PROFILE:-default}"

echo "=== 部署 \${STACK_NAME} 到 \${AWS_REGION} (\${AWS_PROFILE}) ==="

# 创建ECR镜像存储库
echo "=== 创建或更新 CloudFormation 堆栈 ==="
aws cloudformation deploy \\
  --template-file ./aws/cloudformation.yml \\
  --stack-name \${STACK_NAME} \\
  --parameter-overrides Environment=\${ENV} \\
  --capabilities CAPABILITY_IAM \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION}

if [ $? -ne 0 ]; then
  echo "CloudFormation 部署失败!"
  exit 1
fi

# 获取ECR仓库URI
ECR_REPO_URI=$(aws cloudformation describe-stacks \\
  --stack-name \${STACK_NAME} \\
  --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryURI'].OutputValue" \\
  --output text \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION})

echo "=== ECR 仓库: \${ECR_REPO_URI} ==="

# 登录到ECR
echo "=== 登录到 ECR ==="
aws ecr get-login-password \\
  --region \${AWS_REGION} \\
  --profile \${AWS_PROFILE} | docker login \\
  --username AWS \\
  --password-stdin \${ECR_REPO_URI%/*}

# 构建和推送Docker镜像
echo "=== 构建和推送 Docker 镜像 ==="
docker build -t \${ECR_REPO_URI}:latest .
docker push \${ECR_REPO_URI}:latest

# 更新ECS服务以使用新镜像
CLUSTER_NAME=$(aws cloudformation describe-stacks \\
  --stack-name \${STACK_NAME} \\
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \\
  --output text \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION})

SERVICE_NAME=$(aws cloudformation describe-stacks \\
  --stack-name \${STACK_NAME} \\
  --query "Stacks[0].Outputs[?OutputKey=='ECSServiceName'].OutputValue" \\
  --output text \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION})

echo "=== 更新 ECS 服务: \${CLUSTER_NAME}/\${SERVICE_NAME} ==="
aws ecs update-service \\
  --cluster \${CLUSTER_NAME} \\
  --service \${SERVICE_NAME} \\
  --force-new-deployment \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION}

# 获取和显示负载均衡器DNS
LB_DNS=$(aws cloudformation describe-stacks \\
  --stack-name \${STACK_NAME} \\
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \\
  --output text \\
  --profile \${AWS_PROFILE} \\
  --region \${AWS_REGION})

echo "=== 部署完成! ==="
echo "服务URL: http://\${LB_DNS}"
`;
  fs.writeFileSync(path.join(awsDir, 'deploy.sh'), deployScript);
  fs.chmodSync(path.join(awsDir, 'deploy.sh'), '755');
  
  // 创建AWS文档
  const awsReadme = `# AWS 部署

本目录包含了将MCP服务器部署到AWS所需的所有配置文件。

## 文件结构

- \`cloudformation.yml\`: AWS CloudFormation 模板，用于创建完整的 ECS Fargate 部署环境
- \`sam-template.yml\`: AWS SAM 模板，用于创建无服务器 Lambda 部署
- \`deploy.sh\`: 部署脚本，自动执行 CloudFormation 部署、Docker 镜像构建和推送

## 部署选项

### 1. ECS Fargate (容器)

使用 CloudFormation 部署到 ECS Fargate，适合需要持续运行的应用程序。

**资源**:
- VPC 和网络组件
- ECR 仓库
- ECS 集群
- Fargate 服务
- 应用程序负载均衡器
- 自动伸缩配置

**部署步骤**:

1. 确保您有正确配置的 AWS CLI 和 Docker
2. 更新 package.json 中的 AWS 脚本替换 YOUR_AWS_ACCOUNT_ID, YOUR_REGION 和 YOUR_S3_BUCKET
3. 执行部署脚本：

\`\`\`bash
./aws/deploy.sh dev  # 或 prod, staging 等环境名称
\`\`\`

或使用 npm 脚本：

\`\`\`bash
npm run aws:deploy
\`\`\`

### 2. Lambda (无服务器)

使用 AWS SAM 部署到 Lambda，适合事件驱动的应用和降低成本。

**资源**:
- Lambda 函数
- API Gateway HTTP API
- CloudWatch 日志组
- IAM 角色

**部署步骤**:

1. 安装 AWS SAM CLI
2. 创建 S3 桶来存储部署包（如果还没有）
3. 执行：

\`\`\`bash
# 打包应用
npm run aws:package

# 部署到 AWS
npm run aws:sam:deploy
\`\`\`

## 自定义配置

### ECS 部署

可以通过修改 \`cloudformation.yml\` 或在部署时提供参数来自定义部署配置：

\`\`\`bash
aws cloudformation deploy \\
  --template-file ./aws/cloudformation.yml \\
  --stack-name my-app-stack \\
  --parameter-overrides \\
      Environment=prod \\
      ContainerPort=3000 \\
      DesiredCount=2 \\
      MaxCount=10 \\
      ContainerMemory=1024 \\
      ContainerCpu=512
\`\`\`

### Lambda 部署

可以通过修改 \`sam-template.yml\` 自定义 Lambda 部署配置。

## 环境变量

在 CloudFormation 模板和 Lambda 函数中都配置了以下环境变量：

- \`NODE_ENV\`: 运行环境 (development, production)
- \`PORT\`: 应用程序端口

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 AWS CLI 配置
   - 确保您有足够的 IAM 权限
   - 查看 CloudFormation 事件日志

2. **容器无法启动**
   - 检查 ECR 仓库中的 Docker 镜像
   - 查看 ECS 任务日志
   - 验证健康检查配置

3. **API 请求失败**
   - 检查安全组配置
   - 验证负载均衡器目标组健康状态
   - 查看应用程序日志

### 有用的命令

\`\`\`bash
# 查看 CloudFormation 堆栈状态
aws cloudformation describe-stacks --stack-name ${options.name}-dev

# 查看 ECS 服务日志
aws logs get-log-events --log-group-name /ecs/${options.name}-dev --log-stream-name your-log-stream

# 检查 Lambda 函数日志
aws logs get-log-events --log-group-name /aws/lambda/${options.name}-function --log-stream-name your-log-stream
\`\`\`

## 清理资源

要删除所有创建的 AWS 资源，执行：

\`\`\`bash
# 删除 ECS 部署
aws cloudformation delete-stack --stack-name ${options.name}-dev

# 删除 Lambda 部署
aws cloudformation delete-stack --stack-name ${options.name}-sam-dev
\`\`\`

## 学习资源

- [AWS CloudFormation 文档](https://docs.aws.amazon.com/cloudformation/)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [AWS Lambda 文档](https://docs.aws.amazon.com/lambda/)
- [AWS SAM 文档](https://docs.aws.amazon.com/serverless-application-model/)
`;
  fs.writeFileSync(path.join(awsDir, 'README.md'), awsReadme);
}

/**
 * 创建GCP相关配置文件
 */
export function createGCPFiles(basePath: string, options: ScaffoldOptions) {
  // 创建GCP目录
  const gcpDir = path.join(basePath, 'gcp');
  fs.mkdirSync(gcpDir, { recursive: true });
  
  // 创建Cloud Run配置
  const cloudRunConfig = `# Copyright ${new Date().getFullYear()} Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${options.name}
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/${options.name}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "500m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
`;
  fs.writeFileSync(path.join(gcpDir, 'cloud-run.yaml'), cloudRunConfig);
  
  // 创建Cloud Build配置
  const cloudBuildConfig = `# Copyright ${new Date().getFullYear()} Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

steps:
  # 构建Docker镜像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/${options.name}:$COMMIT_SHA', '.']
  
  # 标记为latest
  - name: 'gcr.io/cloud-builders/docker'
    args: ['tag', 'gcr.io/$PROJECT_ID/${options.name}:$COMMIT_SHA', 'gcr.io/$PROJECT_ID/${options.name}:latest']
  
  # 推送到容器注册表
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/${options.name}:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/${options.name}:latest']
  
  # 部署到Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - '${options.name}'
      - '--image'
      - 'gcr.io/$PROJECT_ID/${options.name}:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/${options.name}:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/${options.name}:latest'
`;
  fs.writeFileSync(path.join(gcpDir, 'cloudbuild.yaml'), cloudBuildConfig);
  
  // 创建Cloud Functions配置
  const cloudFunctionsSrc = `/**
 * MCP服务器Cloud Functions入口点
 * 
 * @param {Object} req Cloud Functions请求对象
 * @param {Object} res Cloud Functions响应对象
 */
import { createServer } from '../src/server';

// 初始化MCP服务器
const mcpServer = createServer();

export async function mcpHandler(req, res) {
  try {
    // 构建请求对象
    const request = {
      method: req.method,
      path: req.path,
      headers: req.headers || {},
      body: req.body || {}
    };
    
    // 处理MCP请求
    const response = await mcpServer.handleRequest(request);
    
    // 返回响应
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
  }
}
`;
  fs.writeFileSync(path.join(gcpDir, 'cloud-functions.js'), cloudFunctionsSrc);
  
  // 创建GCP部署脚本
  const deployScript = `#!/bin/bash
# GCP部署脚本
# 用于将MCP服务器部署到Google Cloud Platform

set -e

# 检查命令行参数
ENVIRONMENT=\${1:-"dev"}
PROJECT_ID=\${2:-\$(gcloud config get-value project)}
REGION=\${3:-"us-central1"}

echo "正在部署到GCP (环境: \$ENVIRONMENT, 项目: \$PROJECT_ID, 区域: \$REGION)..."

# 验证gcloud配置
if [ -z "$PROJECT_ID" ]; then
  echo "错误: 未设置Google Cloud项目ID"
  echo "用法: ./deploy.sh [环境] [项目ID] [区域]"
  echo "或者运行: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# 准备应用名称
APP_NAME="${options.name}-\$ENVIRONMENT"
echo "应用名称: \$APP_NAME"

# 确保已安装并登录gcloud
if ! command -v gcloud &> /dev/null; then
  echo "错误: 未安装Google Cloud SDK"
  echo "请访问 https://cloud.google.com/sdk/docs/install 安装"
  exit 1
fi

# 检查gcloud认证
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
  echo "您需要登录Google Cloud:"
  gcloud auth login
fi

# 启用必要的API
echo "启用必要的API..."
gcloud services enable cloudbuild.googleapis.com --project=\$PROJECT_ID
gcloud services enable run.googleapis.com --project=\$PROJECT_ID
gcloud services enable cloudfunctions.googleapis.com --project=\$PROJECT_ID
gcloud services enable storage.googleapis.com --project=\$PROJECT_ID

# 构建并部署到Cloud Run
echo "构建并部署到Cloud Run..."
# 替换配置文件中的PROJECT_ID
sed -i.bak "s/PROJECT_ID/\$PROJECT_ID/g" ./gcp/cloud-run.yaml
sed -i.bak "s/${options.name}/\$APP_NAME/g" ./gcp/cloud-run.yaml

# 使用Cloud Build构建和部署
gcloud builds submit --config=gcp/cloudbuild.yaml . \\
  --substitutions=_ENVIRONMENT=\$ENVIRONMENT,_REGION=\$REGION,_APP_NAME=\$APP_NAME

# 恢复配置文件
mv ./gcp/cloud-run.yaml.bak ./gcp/cloud-run.yaml 2>/dev/null || true

# 获取并显示部署URL
echo "正在获取服务URL..."
SERVICE_URL=\$(gcloud run services describe \$APP_NAME --platform=managed --region=\$REGION --format="value(status.url)")

echo ""
echo "✅ 部署完成!"
echo "服务URL: \$SERVICE_URL"
echo ""
echo "查看日志: gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=\$APP_NAME\" --project=\$PROJECT_ID --limit=10"
echo "查看服务状态: gcloud run services describe \$APP_NAME --platform=managed --region=\$REGION"
echo ""
`;
  fs.writeFileSync(path.join(gcpDir, 'deploy.sh'), deployScript);
  
  // 给部署脚本添加执行权限
  fs.chmodSync(path.join(gcpDir, 'deploy.sh'), '755');
  
  // 创建GCP文档
  const gcpReadme = `# GCP 部署

本目录包含了将MCP服务器部署到GCP所需的所有配置文件。

## 文件结构

- \`cloud-run.yaml\`: GCP Cloud Run配置文件
- \`cloudbuild.yaml\`: GCP Cloud Build配置文件
- \`cloud-functions.js\`: GCP Cloud Functions源代码

## 部署步骤

1. 确保您有正确配置的 gcloud 和 Docker
2. 更新 package.json 中的 GCP 脚本替换 PROJECT_ID 和 YOUR_REGION
3. 执行部署脚本：

\`\`\`bash
./gcp/deploy.sh dev  # 或 prod, staging 等环境名称
\`\`\`

或使用 npm 脚本：

\`\`\`bash
npm run gcp:deploy
\`\`\`

## 自定义配置

### Cloud Run

可以通过修改 \`cloud-run.yaml\` 自定义 Cloud Run配置。

### Cloud Build

可以通过修改 \`cloudbuild.yaml\` 自定义 Cloud Build配置。

### Cloud Functions

可以通过修改 \`cloud-functions.js\` 自定义 Cloud Functions逻辑。

## 环境变量

在 Cloud Run 配置和 Cloud Functions 源代码中都配置了以下环境变量：

- \`NODE_ENV\`: 运行环境 (development, production)
- \`PORT\`: 应用程序端口

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 gcloud 配置
   - 确保您有足够的 IAM 权限
   - 查看 Cloud Run 日志
   - 验证健康检查配置

2. **容器无法启动**
   - 检查 Cloud Run 镜像
   - 查看 Cloud Build 日志
   - 验证 Cloud Functions 源代码是否正确

3. **API 请求失败**
   - 检查安全组配置
   - 验证负载均衡器目标组健康状态
   - 查看应用程序日志

### 有用的命令

\`\`\`bash
# 查看 Cloud Run 服务状态
gcloud run services list --filter="name~${options.name}"

# 查看 Cloud Build 构建历史
gcloud builds list --filter="tags~${options.name}"

# 检查 Cloud Functions 函数日志
gcloud functions logs read --limit 100 --filter="resource.type=cloud_function AND resource.labels.function_name=${options.name}"
\`\`\`

## 清理资源

要删除所有创建的 GCP 资源，执行：

\`\`\`bash
# 删除 Cloud Run 服务
gcloud run services delete ${options.name}

# 删除 Cloud Build 配置
gcloud builds delete --all

# 删除 Cloud Functions 函数
gcloud functions delete ${options.name}
\`\`\`

## 学习资源

- [GCP Cloud Run 文档](https://cloud.google.com/run/docs)
- [GCP Cloud Build 文档](https://cloud.google.com/build/docs)
- [GCP Cloud Functions 文档](https://cloud.google.com/functions/docs)
`;
  fs.writeFileSync(path.join(gcpDir, 'README.md'), gcpReadme);
}

/**
 * 创建Azure相关配置文件
 */
export function createAzureFiles(basePath: string, options: ScaffoldOptions) {
  // 创建Azure目录
  const azureDir = path.join(basePath, 'azure');
  fs.mkdirSync(azureDir, { recursive: true });
  
  // 创建App Service配置
  const appServiceConfig = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appName": {
      "type": "string",
      "defaultValue": "${options.name}",
      "metadata": {
        "description": "The name of the app service"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": {
        "description": "Location for all resources"
      }
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2018-11-01",
      "name": "[parameters('appName')]",
      "location": "[parameters('location')]",
      "kind": "app",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', concat(parameters('appName'), '-plan'))]"
      }
    }
  ]
}`;
  fs.writeFileSync(path.join(azureDir, 'app-service.json'), appServiceConfig);
  
  // 创建Function App配置
  const functionAppConfig = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "functionAppName": {
      "type": "string",
      "defaultValue": "${options.name}-function",
      "metadata": {
        "description": "The name of the function app"
      }
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2018-11-01",
      "name": "[parameters('functionAppName')]",
      "location": "[resourceGroup().location]",
      "kind": "functionapp",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', concat(parameters('functionAppName'), '-plan'))]"
      }
    }
  ]
}`;
  fs.writeFileSync(path.join(azureDir, 'function-app.json'), functionAppConfig);
  
  // 创建Container App配置
  const containerAppConfig = `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "containerAppName": {
      "type": "string",
      "defaultValue": "${options.name}-container",
      "metadata": {
        "description": "The name of the container app"
      }
    }
  },
  "resources": [
    {
      "type": "Microsoft.App/containerApps",
      "apiVersion": "2022-01-01-preview",
      "name": "[parameters('containerAppName')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "template": {
          "containers": [
            {
              "name": "[parameters('containerAppName')]",
              "image": "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
            }
          ]
        }
      }
    }
  ]
}`;
  fs.writeFileSync(path.join(azureDir, 'container-app.json'), containerAppConfig);
  
  // 创建Azure Function Handler
  const functionHandler = `module.exports = async function (context, req) {
  context.log('MCP Server function triggered');
  
  try {
    // 导入MCP服务器
    const { createServer } = require('./server');
    const mcpServer = createServer();
    
    // 构建请求对象
    const request = {
      method: req.method,
      path: req.url,
      headers: req.headers || {},
      body: req.body || {}
    };
    
    // 处理MCP请求
    const response = await mcpServer.handleRequest(request);
    
    // 返回响应
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: response
    };
  } catch (error) {
    context.log.error('Error processing request:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: 'Internal Server Error',
        message: error.message
      }
    };
  }
};`;
  fs.writeFileSync(path.join(azureDir, 'function.js'), functionHandler);
  
  // 创建部署脚本
  const deployScript = `#!/bin/bash
# Azure 部署脚本
# 用法: ./deploy.sh [资源组名称] [位置] [环境]

RESOURCE_GROUP=\${1:-${options.name}-rg}
LOCATION=\${2:-eastus}
ENV=\${3:-dev}
APP_NAME="${options.name}-\${ENV}"

echo "=== 部署 ${options.name} 到 Azure (\$RESOURCE_GROUP) ==="

# 确认已登录Azure
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "请先登录Azure: az login"
  exit 1
fi

# 创建资源组（如果不存在）
az group create --name $RESOURCE_GROUP --location $LOCATION

# 选择部署选项
echo "请选择部署目标:"
echo "1) App Service (Web应用)"
echo "2) Function App (无服务器函数)"
echo "3) Container App (容器应用)"
read -p "选择 [1-3]: " DEPLOY_TARGET

case $DEPLOY_TARGET in
  1)
    # 部署到App Service
    echo "=== 部署到 App Service ==="
    az deployment group create \\
      --resource-group $RESOURCE_GROUP \\
      --template-file ./azure/app-service.json \\
      --parameters appName=$APP_NAME
    ;;
  2)
    # 部署到Function App
    echo "=== 部署到 Function App ==="
    az deployment group create \\
      --resource-group $RESOURCE_GROUP \\
      --template-file ./azure/function-app.json \\
      --parameters functionAppName=$APP_NAME-function
    ;;
  3)
    # 部署到Container App
    echo "=== 部署到 Container App ==="
    az deployment group create \\
      --resource-group $RESOURCE_GROUP \\
      --template-file ./azure/container-app.json \\
      --parameters containerAppName=$APP_NAME-container
    ;;
  *)
    echo "无效的选择"
    exit 1
    ;;
esac

echo "=== 部署完成! ==="`;
  fs.writeFileSync(path.join(azureDir, 'deploy.sh'), deployScript);
  fs.chmodSync(path.join(azureDir, 'deploy.sh'), '755');
  
  // 添加到package.json脚本
  const packageJsonPath = path.join(basePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (options.cloudProvider === 'azure') {
    packageJson.scripts = {
      ...packageJson.scripts,
      "azure:deploy": "./azure/deploy.sh",
      "azure:deploy:app": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/app-service.json",
      "azure:deploy:function": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/function-app.json",
      "azure:deploy:container": "az deployment group create --resource-group YOUR_RESOURCE_GROUP --template-file ./azure/container-app.json"
    };
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // 创建README文件
  const azureReadme = `# Microsoft Azure 部署

本目录包含了将MCP服务器部署到Microsoft Azure所需的基本配置文件。

## 文件列表

- \`app-service.json\`: Azure App Service ARM模板
- \`function-app.json\`: Azure Function App ARM模板
- \`container-app.json\`: Azure Container App ARM模板
- \`function.js\`: Azure Function处理程序
- \`deploy.sh\`: 部署脚本

## 部署方法

1. 安装Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli
2. 登录Azure: \`az login\`
3. 运行部署脚本: \`./azure/deploy.sh\`

## 更多信息

- Azure App Service: https://azure.microsoft.com/services/app-service/
- Azure Functions: https://azure.microsoft.com/services/functions/
- Azure Container Apps: https://azure.microsoft.com/services/container-apps/`;
  fs.writeFileSync(path.join(azureDir, 'README.md'), azureReadme);
}

/**
 * 创建阿里云相关配置文件
 */
export function createAlibabaFiles(basePath: string, options: ScaffoldOptions) {
  // 创建阿里云目录
  const alibabaDir = path.join(basePath, 'alibaba');
  fs.mkdirSync(alibabaDir, { recursive: true });
  
  // 创建函数计算配置
  const fcConfig = `{
  "ROSTemplateFormatVersion": "2015-09-01",
  "Description": "Alibaba Cloud Function Compute",
  "Parameters": {
    "ServiceName": {
      "Type": "String",
      "Default": "${options.name}-service",
      "Description": "Function Compute service name"
    },
    "FunctionName": {
      "Type": "String",
      "Default": "${options.name}",
      "Description": "Function name"
    },
    "MemorySize": {
      "Type": "Number",
      "Default": 512,
      "Description": "Memory size"
    },
    "Timeout": {
      "Type": "Number",
      "Default": 60,
      "Description": "Timeout in seconds"
    }
  },
  "Resources": {
    "Service": {
      "Type": "ALIYUN::FC::Service",
      "Properties": {
        "ServiceName": {
          "Ref": "ServiceName"
        },
        "Description": "${options.description || 'MCP Server on Alibaba Cloud'}"
      }
    },
    "Function": {
      "Type": "ALIYUN::FC::Function",
      "Properties": {
        "ServiceName": {
          "Ref": "ServiceName"
        },
        "FunctionName": {
          "Ref": "FunctionName"
        },
        "Handler": "index.handler",
        "Runtime": "nodejs14",
        "MemorySize": {
          "Ref": "MemorySize"
        },
        "Timeout": {
          "Ref": "Timeout"
        },
        "Code": {
          "ZipFile": "exports.handler = function(event, context, callback) { callback(null, 'hello world'); };"
        }
      }
    }
  },
  "Outputs": {
    "ServiceName": {
      "Value": {
        "Ref": "ServiceName"
      }
    },
    "FunctionName": {
      "Value": {
        "Ref": "FunctionName"
      }
    }
  }
}`;
  fs.writeFileSync(path.join(alibabaDir, 'fc-template.json'), fcConfig);
  
  // 创建ECS配置
  const ecsConfig = `{
  "ROSTemplateFormatVersion": "2015-09-01",
  "Description": "Alibaba Cloud ECS Instance for MCP Server",
  "Parameters": {
    "InstanceName": {
      "Type": "String",
      "Default": "${options.name}",
      "Description": "ECS instance name"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "ecs.g6.large",
      "Description": "ECS instance type"
    },
    "ImageId": {
      "Type": "String",
      "Default": "centos_7_8_x64_20G_alibase_20200914.vhd",
      "Description": "Image ID"
    },
    "Password": {
      "Type": "String",
      "NoEcho": true,
      "Description": "ECS instance password"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "ALIYUN::ECS::VPC",
      "Properties": {
        "VpcName": "${options.name}-vpc",
        "CidrBlock": "192.168.0.0/16"
      }
    },
    "VSwitch": {
      "Type": "ALIYUN::ECS::VSwitch",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ZoneId": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": {
                "Ref": "ALIYUN::Region"
              }
            }
          ]
        },
        "CidrBlock": "192.168.1.0/24",
        "VSwitchName": "${options.name}-vswitch"
      }
    },
    "SecurityGroup": {
      "Type": "ALIYUN::ECS::SecurityGroup",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupName": "${options.name}-sg",
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "PortRange": "22/22",
            "SourceCidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "PortRange": "${options.port || 3000}/${options.port || 3000}",
            "SourceCidrIp": "0.0.0.0/0"
          }
        ]
      }
    },
    "ECSInstance": {
      "Type": "ALIYUN::ECS::Instance",
      "Properties": {
        "InstanceName": {
          "Ref": "InstanceName"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "ImageId": {
          "Ref": "ImageId"
        },
        "Password": {
          "Ref": "Password"
        },
        "SecurityGroupId": {
          "Ref": "SecurityGroup"
        },
        "VSwitchId": {
          "Ref": "VSwitch"
        },
        "SystemDiskCategory": "cloud_efficiency",
        "SystemDiskSize": 40
      }
    }
  },
  "Outputs": {
    "InstanceId": {
      "Value": {
        "Ref": "ECSInstance"
      }
    },
    "PublicIp": {
      "Value": {
        "Fn::GetAtt": [
          "ECSInstance",
          "PublicIp"
        ]
      }
    }
  }
}`;
  fs.writeFileSync(path.join(alibabaDir, 'ecs-template.json'), ecsConfig);
  
  // 创建容器服务配置
  const k8sConfig = `{
  "ROSTemplateFormatVersion": "2015-09-01",
  "Description": "Alibaba Cloud Container Service for Kubernetes(ACK)",
  "Parameters": {
    "ClusterName": {
      "Type": "String",
      "Default": "${options.name}-cluster",
      "Description": "Kubernetes cluster name"
    },
    "WorkerInstanceType": {
      "Type": "String",
      "Default": "ecs.g6.large",
      "Description": "Worker node instance type"
    },
    "NumOfNodes": {
      "Type": "Number",
      "Default": 2,
      "MinValue": 0,
      "MaxValue": 300,
      "Description": "Number of worker nodes"
    },
    "Password": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Node password"
    }
  },
  "Resources": {
    "ManagedKubernetesCluster": {
      "Type": "ALIYUN::CS::ManagedKubernetesCluster",
      "Properties": {
        "Name": {
          "Ref": "ClusterName"
        },
        "DisableRollback": true,
        "TimeoutMins": 60,
        "ClusterSpec": "ack.pro.small",
        "ContainerCidr": "172.20.0.0/16",
        "ServiceCidr": "172.21.0.0/20",
        "LoginPassword": {
          "Ref": "Password"
        },
        "NumOfNodes": {
          "Ref": "NumOfNodes"
        },
        "WorkerInstanceType": {
          "Ref": "WorkerInstanceType"
        },
        "WorkerSystemDiskCategory": "cloud_efficiency",
        "WorkerSystemDiskSize": 120,
        "WorkerDataDisks": [
          {
            "Category": "cloud_efficiency",
            "Size": 120
          }
        ],
        "NodePortRange": "30000-32767",
        "EndpointPublicAccess": true
      }
    }
  },
  "Outputs": {
    "ClusterId": {
      "Value": {
        "Fn::GetAtt": [
          "ManagedKubernetesCluster",
          "ClusterId"
        ]
      }
    },
    "WorkerNodes": {
      "Value": {
        "Fn::GetAtt": [
          "ManagedKubernetesCluster",
          "WorkerNodes"
        ]
      }
    }
  }
}`;
  fs.writeFileSync(path.join(alibabaDir, 'ack-template.json'), k8sConfig);
  
  // 创建函数计算处理程序
  const fcHandler = `'use strict';

exports.handler = (event, context, callback) => {
  // 解析事件对象
  let evt;
  try {
    evt = JSON.parse(event.toString());
  } catch (err) {
    evt = event;
  }
  
  console.log('Event received:', JSON.stringify(evt));
  
  // 导入MCP服务器
  const { createServer } = require('./server');
  const mcpServer = createServer();
  
  // 处理请求
  const request = {
    method: evt.method || 'POST',
    path: evt.path || '/',
    headers: evt.headers || {},
    body: evt.body || {}
  };
  
  mcpServer.handleRequest(request)
    .then(response => {
      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
      });
    })
    .catch(error => {
      console.error('Error processing request:', error);
      callback(null, {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: error.message
        })
      });
    });
};`;
  fs.writeFileSync(path.join(alibabaDir, 'fc-handler.js'), fcHandler);
  
  // 创建部署脚本
  const deployScript = `#!/bin/bash
# 阿里云部署脚本
# 用法: ./deploy.sh [部署类型] [地域] [资源组]

DEPLOY_TYPE=\${1:-"fc"}
REGION=\${2:-"cn-hangzhou"}
RESOURCE_GROUP=\${3:-"${options.name}-rg"}

echo "=== 部署 ${options.name} 到阿里云 (\$DEPLOY_TYPE, \$REGION) ==="

# 确保 Alibaba Cloud CLI 已安装
which aliyun > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "错误: 请先安装阿里云CLI: https://help.aliyun.com/document_detail/121541.html"
  exit 1
fi

# 检查是否已登录
aliyun sts GetCallerIdentity > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "错误: 请先登录阿里云: aliyun configure"
  exit 1
fi

# 根据部署类型选择模板
case $DEPLOY_TYPE in
  "fc")
    TEMPLATE="fc-template.json"
    ;;
  "ecs")
    TEMPLATE="ecs-template.json"
    ;;
  "ack")
    TEMPLATE="ack-template.json"
    ;;
  *)
    echo "错误: 无效的部署类型。可选值: fc, ecs, ack"
    exit 1
    ;;
esac

# 使用ROS服务部署
echo "=== 使用 $TEMPLATE 部署到 $REGION 区域 ==="
aliyun ros CreateStack --RegionId $REGION --StackName ${options.name}-stack-\$DEPLOY_TYPE --TemplateBody "$(cat ./alibaba/$TEMPLATE)"

echo "=== 部署请求已提交 ==="
echo "您可以在ROS控制台查看部署状态: https://rosnext.console.aliyun.com/"`;
  fs.writeFileSync(path.join(alibabaDir, 'deploy.sh'), deployScript);
  fs.chmodSync(path.join(alibabaDir, 'deploy.sh'), '755');
  
  // 添加到package.json脚本
  const packageJsonPath = path.join(basePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (options.cloudProvider === 'alibaba') {
    packageJson.scripts = {
      ...packageJson.scripts,
      "alibaba:deploy:fc": "./alibaba/deploy.sh fc",
      "alibaba:deploy:ecs": "./alibaba/deploy.sh ecs",
      "alibaba:deploy:ack": "./alibaba/deploy.sh ack"
    };
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // 创建README文件
  const alibabaReadme = `# 阿里云部署

本目录包含了将MCP服务器部署到阿里云所需的基本配置文件。

## 文件列表

- \`fc-template.json\`: 函数计算（Function Compute）ROS模板
- \`ecs-template.json\`: 云服务器ECS ROS模板
- \`ack-template.json\`: 容器服务Kubernetes版（ACK）ROS模板
- \`fc-handler.js\`: 函数计算处理程序
- \`deploy.sh\`: 部署脚本

## 部署选项

阿里云提供多种计算服务，您可以根据需求选择适合的部署方式：

### 函数计算（Serverless）

适合事件驱动型应用，无需管理服务器，按调用次数计费。

\`\`\`bash
# 部署到函数计算
./alibaba/deploy.sh fc
\`\`\`

### 云服务器ECS

传统的虚拟机部署，完全控制服务器环境。

\`\`\`bash
# 部署到ECS
./alibaba/deploy.sh ecs
\`\`\`

### 容器服务Kubernetes版（ACK）

基于Kubernetes的容器编排服务，适合微服务架构。

\`\`\`bash
# 部署到ACK
./alibaba/deploy.sh ack
\`\`\`

## 前提条件

1. 安装阿里云CLI：https://help.aliyun.com/document_detail/121541.html
2. 配置阿里云账号：\`aliyun configure\`
3. 确保有足够的账户余额和权限

## 更多信息

- 函数计算：https://www.alibabacloud.com/help/product/50980.htm
- 云服务器ECS：https://www.alibabacloud.com/help/product/25365.htm
- 容器服务Kubernetes版：https://www.alibabacloud.com/help/product/85222.htm
- 资源编排ROS：https://www.alibabacloud.com/help/product/28850.htm`;
  fs.writeFileSync(path.join(alibabaDir, 'README.md'), alibabaReadme);
}

/**
 * 执行脚手架命令
 */
export async function scaffoldProject(options: Partial<ScaffoldOptions> & { prompt?: boolean } = {}) {
  let answers: any = {};
  
  // 默认情况下启用提示，除非明确指定--no-prompt
  if (options.prompt !== false) {
    // 开始交互式提问
    answers = await inquirer.prompt([
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
        name: 'kubernetes',
        message: '添加Kubernetes支持?',
        default: DEFAULT_OPTIONS.kubernetes,
        when: (answers) => answers.docker // 只有在选择了Docker时才提供K8s选项
      },
      {
        type: 'confirm',
        name: 'helmChart',
        message: '创建Helm Chart?',
        default: DEFAULT_OPTIONS.helmChart,
        when: (answers) => answers.kubernetes // 只有在选择了K8s时才提供Helm选项
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
          { name: 'Jenkins', value: 'jenkins' },
          { name: 'Azure DevOps', value: 'azure' },
          { name: 'Travis CI', value: 'travis' },
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
      },
      {
        type: 'input',
        name: 'port',
        message: 'HTTP服务器端口:',
        default: DEFAULT_OPTIONS.port?.toString() || '3000',
        when: (answers) => answers.transport !== 'stdio', // 只有在使用HTTP或both时才询问端口
        validate: (input: string) => {
          const port = parseInt(input, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            return '请输入1-65535之间的有效端口号';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'cloudProvider',
        message: '添加云服务提供商支持?',
        choices: [
          { name: '不添加', value: 'none' },
          { name: 'AWS (Amazon Web Services)', value: 'aws' },
          { name: 'GCP (Google Cloud Platform)', value: 'gcp' },
          { name: 'Azure (Microsoft Azure)', value: 'azure' },
          { name: 'Alibaba Cloud (阿里云)', value: 'alibaba' }
        ],
        default: DEFAULT_OPTIONS.cloudProvider,
        when: (answers) => answers.docker // 只有在选择了Docker时才提供云服务选项
      }
    ]);
  } else {
    // 无交互模式，设置destination如果未提供
    if (!options.destination && options.name) {
      options.destination = path.join(process.cwd(), options.name);
    }
  }

  const finalOptions: ScaffoldOptions = { 
    ...DEFAULT_OPTIONS, 
    ...options, 
    ...answers,
    port: parseInt((answers.port || options.port || DEFAULT_OPTIONS.port)?.toString() || '3000', 10)
  } as ScaffoldOptions;
  
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
  
  // 创建Docker文件
  if (finalOptions.docker) {
    spinner.text = '创建Docker文件...';
    spinner.start();
    try {
      createDockerFiles(finalOptions.destination, finalOptions);
      spinner.succeed('Docker文件创建完成');
    } catch (error) {
      spinner.fail(`创建Docker文件失败: ${error}`);
      return;
    }
  }
  
  // 创建Kubernetes文件
  if (finalOptions.kubernetes) {
    spinner.text = '创建Kubernetes文件...';
    spinner.start();
    try {
      createKubernetesFiles(finalOptions.destination, finalOptions);
      spinner.succeed('Kubernetes文件创建完成');
    } catch (error) {
      spinner.fail(`创建Kubernetes文件失败: ${error}`);
      return;
    }
  }
  
  // 创建Helm Chart
  if (finalOptions.helmChart) {
    spinner.text = '创建Helm Chart...';
    spinner.start();
    try {
      createHelmChart(finalOptions.destination, finalOptions);
      spinner.succeed('Helm Chart创建完成');
    } catch (error) {
      spinner.fail(`创建Helm Chart失败: ${error}`);
      return;
    }
  }
  
  // 创建云服务提供商文件
  if (finalOptions.cloudProvider && finalOptions.cloudProvider !== 'none') {
    spinner.text = `创建${finalOptions.cloudProvider.toUpperCase()}云服务提供商文件...`;
    spinner.start();
    try {
      if (finalOptions.cloudProvider === 'aws') {
        createAWSFiles(finalOptions.destination, finalOptions);
      } else if (finalOptions.cloudProvider === 'gcp') {
        createGCPFiles(finalOptions.destination, finalOptions);
      } else if (finalOptions.cloudProvider === 'azure') {
        createAzureFiles(finalOptions.destination, finalOptions);
      } else if (finalOptions.cloudProvider === 'alibaba') {
        createAlibabaFiles(finalOptions.destination, finalOptions);
      }
      spinner.succeed(`${finalOptions.cloudProvider.toUpperCase()}云服务提供商文件创建完成`);
    } catch (error) {
      spinner.fail(`创建${finalOptions.cloudProvider.toUpperCase()}云服务提供商文件失败: ${error}`);
      return;
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
    .option('-n, --name <n>', '服务器名称')
    .option('-d, --description <description>', '服务器描述')
    .option('-a, --author <author>', '作者')
    .option('-v, --version <version>', '初始版本')
    .option('-t, --transport <transport>', '传输协议 (stdio, http, both)')
    .option('-ts, --typescript', '使用TypeScript')
    .option('-i, --install-deps', '自动安装依赖')
    .option('--docker', '添加Docker支持')
    .option('--kubernetes', '添加Kubernetes支持')
    .option('--helm-chart', '创建Helm Chart')
    .option('--cloud-provider <provider>', '添加云服务提供商支持 (aws, gcp, azure, alibaba)')
    .option('--cicd', '添加CI/CD支持')
    .option('--cicd-platform <platform>', 'CI/CD平台 (github, gitlab, circleci, jenkins, azure, travis, both, all)')
    .option('-p, --port <port>', 'HTTP服务器端口', '3000')
    .option('--no-prompt', '无交互模式，使用命令行参数和默认值')
    .action((options) => scaffoldProject(options));
} 