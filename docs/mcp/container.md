# MCP容器运行时

MCP容器运行时模块提供了将MCP服务器部署到Docker等容器环境的底层功能，使开发者能够在隔离、可移植和一致的环境中运行MCP服务器。

## 功能概述

- Docker容器生命周期管理
- 容器状态监控
- 资源使用跟踪
- 日志获取
- 命令执行
- 健康检查
- 网络和卷管理

## 架构设计

容器运行时模块采用了可扩展的接口设计，主要包含以下组件：

### 容器配置接口

```typescript
export interface ContainerConfig {
  // 容器镜像
  image: string;
  // 容器名称
  name?: string;
  // 环境变量
  env?: Record<string, string>;
  // 端口映射 hostPort:containerPort
  ports?: Record<string, string>;
  // 卷映射 hostPath:containerPath
  volumes?: Record<string, string>;
  // 工作目录
  workDir?: string;
  // 启动命令
  command?: string[];
  // 重启策略
  restartPolicy?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  // 资源限制
  resources?: {
    cpuLimit?: string;
    memoryLimit?: string;
    memoryReservation?: string;
  };
  // 网络配置
  network?: {
    name?: string;
    aliases?: string[];
    ipAddress?: string;
  };
  // 健康检查
  healthCheck?: {
    command: string[];
    interval?: number;
    timeout?: number;
    retries?: number;
    startPeriod?: number;
  };
  // 元数据标签
  labels?: Record<string, string>;
}
```

### 容器信息接口

```typescript
export interface ContainerInfo {
  // 容器ID
  id: string;
  // 容器名称
  name: string;
  // 镜像名称
  image: string;
  // 容器状态
  state: 'created' | 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  // 创建时间
  created: string;
  // 启动时间
  started?: string;
  // 退出时间
  finished?: string;
  // 退出代码
  exitCode?: number;
  // 运行时信息
  stats?: {
    cpuUsage?: number;
    memoryUsage?: string;
    networkRx?: string;
    networkTx?: string;
  };
  // 端口映射
  ports?: Record<string, string>;
  // 卷映射
  volumes?: Record<string, string>;
  // IP地址
  ipAddress?: string;
  // 容器网络
  network?: string;
  // 环境变量
  env?: Record<string, string>;
  // 标签
  labels?: Record<string, string>;
}
```

### 容器运行时接口

核心功能通过`ContainerRuntime`接口定义:

```typescript
export interface ContainerRuntime {
  runContainer(serverDef: MCPServerDefinition, config: ContainerConfig): Promise<ContainerInfo>;
  stopContainer(containerId: string, timeout?: number): Promise<boolean>;
  restartContainer(containerId: string, timeout?: number): Promise<ContainerInfo>;
  removeContainer(containerId: string, force?: boolean): Promise<boolean>;
  getContainerInfo(containerId: string): Promise<ContainerInfo>;
  getContainerLogs(containerId: string, options?: ContainerLogOptions): Promise<string>;
  execCommand(containerId: string, command: string[]): Promise<string>;
  checkHealth(containerId: string): Promise<'healthy' | 'unhealthy' | 'starting' | 'unknown'>;
  listContainers(all?: boolean, filters?: Record<string, string>): Promise<ContainerInfo[]>;
  getStats(containerId: string): Promise<ContainerInfo['stats']>;
}
```

## Docker运行时实现

`DockerRuntime`实现了`ContainerRuntime`接口，使用Docker CLI命令进行容器操作:

```typescript
export class DockerRuntime implements ContainerRuntime {
  async isDockerInstalled(): Promise<boolean>;
  async runContainer(serverDef: MCPServerDefinition, config: ContainerConfig): Promise<ContainerInfo>;
  async stopContainer(containerId: string, timeout?: number): Promise<boolean>;
  async restartContainer(containerId: string, timeout?: number): Promise<ContainerInfo>;
  async removeContainer(containerId: string, force?: boolean): Promise<boolean>;
  async getContainerInfo(containerId: string): Promise<ContainerInfo>;
  async getContainerLogs(containerId: string, options?: ContainerLogOptions): Promise<string>;
  async execCommand(containerId: string, command: string[]): Promise<string>;
  async checkHealth(containerId: string): Promise<'healthy' | 'unhealthy' | 'starting' | 'unknown'>;
  async listContainers(all?: boolean, filters?: Record<string, string>): Promise<ContainerInfo[]>;
  async getStats(containerId: string): Promise<ContainerInfo['stats']>;
  async createNetwork(name: string, driver?: string): Promise<boolean>;
  async generateDockerfile(content: string): Promise<string>;
  async buildImage(dockerfilePath: string, tag: string, buildArgs?: Record<string, string>): Promise<string>;
}
```

## 云托管集成

容器运行时与MCP云托管系统的集成通过`DockerContainerProvider`实现，该提供者实现了`CloudProvider`接口:

```typescript
export class DockerContainerProvider implements CloudProvider {
  readonly type = MCPCloudProviderType.DOCKER;
  
  constructor(credentials: DockerCredentials);
  
  async deploy(
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  async update(
    deploymentId: string,
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  async remove(deploymentId: string): Promise<boolean>;
  
  async getStatus(deploymentId: string): Promise<MCPDeploymentResult>;
  
  async getLogs(deploymentId: string): Promise<string>;
}
```

## 使用示例

### 基础容器操作

```typescript
import { DockerRuntime, ContainerConfig } from './mcp/cloud/runtime';

// 创建Docker运行时实例
const dockerRuntime = new DockerRuntime();

// 检查Docker是否已安装
const isInstalled = await dockerRuntime.isDockerInstalled();
if (!isInstalled) {
  console.error('Docker未安装，请先安装Docker');
  return;
}

// 配置容器
const containerConfig: ContainerConfig = {
  image: 'node:16-alpine',
  name: 'mcp-server-example',
  ports: {
    '8080': '3000'
  },
  env: {
    NODE_ENV: 'production',
    PORT: '3000'
  },
  command: ['node', 'server.js'],
  volumes: {
    './app': '/app'
  },
  workDir: '/app',
  restartPolicy: 'always'
};

// 运行容器
try {
  const containerInfo = await dockerRuntime.runContainer(serverDefinition, containerConfig);
  console.log(`容器已启动: ${containerInfo.id}`);
  console.log(`访问地址: http://localhost:8080`);
  
  // 获取日志
  const logs = await dockerRuntime.getContainerLogs(containerInfo.id, { tail: 100 });
  console.log('容器日志:', logs);
  
  // 执行命令
  const nodeVersion = await dockerRuntime.execCommand(containerInfo.id, ['node', '--version']);
  console.log('Node版本:', nodeVersion);
  
  // 检查健康状态
  const health = await dockerRuntime.checkHealth(containerInfo.id);
  console.log('健康状态:', health);
  
  // 获取资源使用统计
  const stats = await dockerRuntime.getStats(containerInfo.id);
  console.log('CPU使用率:', stats.cpuUsage);
  console.log('内存使用:', stats.memoryUsage);
  
  // 停止容器
  await dockerRuntime.stopContainer(containerInfo.id);
  
  // 删除容器
  await dockerRuntime.removeContainer(containerInfo.id);
} catch (error) {
  console.error('容器操作失败:', error);
}
```

### 自定义Docker镜像

```typescript
import { DockerRuntime } from './mcp/cloud/runtime';

const dockerRuntime = new DockerRuntime();

// 创建Dockerfile
const dockerfileContent = `
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
`;

// 生成Dockerfile
const dockerfilePath = await dockerRuntime.generateDockerfile(dockerfileContent);

// 构建镜像
const imageId = await dockerRuntime.buildImage(dockerfilePath, 'my-mcp-server:latest');

console.log(`镜像构建成功: ${imageId}`);
```

### 使用自定义网络

```typescript
import { DockerRuntime, ContainerConfig } from './mcp/cloud/runtime';

const dockerRuntime = new DockerRuntime();

// 创建网络
const networkName = 'mcp-network';
await dockerRuntime.createNetwork(networkName);

// 配置容器使用自定义网络
const containerConfig: ContainerConfig = {
  image: 'node:16-alpine',
  name: 'mcp-server-example',
  network: {
    name: networkName,
    aliases: ['api-server']
  },
  command: ['node', 'server.js']
};

// 运行容器
const containerInfo = await dockerRuntime.runContainer(serverDefinition, containerConfig);
```

## 最佳实践

1. **资源限制**：始终为容器配置资源限制，避免单个容器消耗过多系统资源：

```typescript
const containerConfig: ContainerConfig = {
  // 其他配置...
  resources: {
    cpuLimit: '0.5',
    memoryLimit: '512M',
    memoryReservation: '256M'
  }
};
```

2. **健康检查**：配置健康检查确保服务正常运行：

```typescript
const containerConfig: ContainerConfig = {
  // 其他配置...
  healthCheck: {
    command: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
    interval: 30,
    timeout: 10,
    retries: 3,
    startPeriod: 5
  }
};
```

3. **数据持久化**：使用卷映射保存重要数据：

```typescript
const containerConfig: ContainerConfig = {
  // 其他配置...
  volumes: {
    '/data/mcp/db': '/app/data',
    '/data/mcp/logs': '/app/logs'
  }
};
```

4. **网络隔离**：使用自定义网络隔离相关容器：

```typescript
// 创建网络
await dockerRuntime.createNetwork('mcp-network');

// 配置容器使用该网络
const containerConfig: ContainerConfig = {
  // 其他配置...
  network: {
    name: 'mcp-network'
  }
};
```

5. **优雅关闭**：关闭容器时给予足够时间处理现有连接：

```typescript
// 给予30秒关闭时间
await dockerRuntime.stopContainer(containerId, 30);
```

## 错误处理

容器运行时操作可能因多种原因失败，建议使用try/catch处理异常：

```typescript
try {
  await dockerRuntime.runContainer(serverDefinition, containerConfig);
} catch (error) {
  console.error('启动容器失败:', error.message);
  // 处理失败情况
}
```

## 安全考虑

1. 避免在容器中使用root用户运行应用
2. 限制容器的系统调用和权限
3. 定期更新基础镜像以修复安全漏洞
4. 使用只读文件系统挂载不需要写入的目录
5. 避免在环境变量中存储敏感信息

## 调试提示

1. **查看日志**：使用`getContainerLogs`方法获取容器日志是排查问题的首要步骤
2. **检查健康状态**：`checkHealth`方法可以快速确认容器是否健康
3. **查看资源使用**：`getStats`方法可以帮助诊断性能问题
4. **执行命令**：`execCommand`方法可以在容器内执行诊断命令
5. **检查网络连接**：确保端口映射正确，网络配置无误 