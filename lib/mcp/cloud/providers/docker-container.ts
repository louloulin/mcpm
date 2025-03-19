/**
 * Docker容器云提供者
 * 将容器运行时集成到MCP云托管系统
 */
import { MCPServerDefinition, MCPCloudHostingConfig, MCPCloudProviderType, MCPDeploymentResult } from '../../types';
import { CloudProvider, DeploymentProgressCallback, DockerCredentials } from '../types';
import { ContainerConfig } from '../runtime/container';
import { DockerRuntime } from '../runtime/docker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Docker容器配置类型
 */
export interface DockerContainerConfig {
  // 基础镜像
  baseImage?: string;
  // 容器名称
  containerName?: string;
  // 端口映射
  ports?: Record<string, string>;
  // 卷映射
  volumes?: Record<string, string>;
  // 环境变量
  env?: Record<string, string>;
  // 重启策略
  restartPolicy?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  // 资源限制
  resources?: {
    cpuLimit?: string;
    memoryLimit?: string;
  };
  // 自定义Dockerfile内容
  dockerfileContent?: string;
  // 健康检查
  healthCheck?: {
    command: string;
    interval?: number;
    timeout?: number;
    retries?: number;
    startPeriod?: number;
  };
  // 使用自定义网络
  useCustomNetwork?: boolean;
  // 自定义网络名称
  networkName?: string;
  // 挂载源代码
  mountSourceCode?: boolean;
  // 源代码路径
  sourceCodePath?: string;
  // 使用Docker Compose
  useCompose?: boolean;
}

/**
 * Docker容器云提供者
 * 实现将MCP服务器部署到Docker容器
 */
export class DockerContainerProvider implements CloudProvider {
  readonly type = MCPCloudProviderType.DOCKER;
  private runtime: DockerRuntime;
  private deployments: Map<string, { containerId: string }> = new Map();
  private credentials: DockerCredentials;
  
  /**
   * 构造函数
   * @param credentials Docker凭证
   */
  constructor(credentials: DockerCredentials) {
    this.credentials = credentials;
    this.runtime = new DockerRuntime();
  }
  
  /**
   * 部署服务器到Docker容器
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  async deploy(
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult> {
    try {
      // 检查Docker是否已安装
      if (!await this.runtime.isDockerInstalled()) {
        throw new Error('Docker未安装或无法访问');
      }
      
      progressCallback?.('准备', '正在准备Docker容器部署', 10);
      
      // 提取Docker容器配置
      const dockerConfig = config.providerConfig as DockerContainerConfig || {};
      
      // 确定基础镜像
      const baseImage = dockerConfig.baseImage || 'node:16-alpine';
      let finalImage = baseImage;
      
      // 如果提供了自定义Dockerfile，则构建自定义镜像
      if (dockerConfig.dockerfileContent) {
        progressCallback?.('构建', '正在创建自定义镜像', 20);
        
        // 生成Dockerfile
        const dockerfilePath = await this.runtime.generateDockerfile(dockerConfig.dockerfileContent);
        
        // 构建镜像
        const tag = `mcp-server-${server.name.toLowerCase()}-${server.version}:custom`;
        await this.runtime.buildImage(dockerfilePath, tag);
        
        finalImage = tag;
        progressCallback?.('构建', '自定义镜像构建完成', 40);
      }
      
      // 准备容器配置
      const containerConfig: ContainerConfig = {
        image: finalImage,
        name: dockerConfig.containerName || `mcp-server-${server.name.toLowerCase()}-${uuidv4().substring(0, 8)}`,
        env: {
          // 添加MCP服务器相关环境变量
          MCP_SERVER_NAME: server.name,
          MCP_SERVER_VERSION: server.version,
          MCP_SERVER_URL: server.url,
          NODE_ENV: 'production',
          ...dockerConfig.env
        },
        ports: dockerConfig.ports || {},
        volumes: dockerConfig.volumes || {},
        restartPolicy: dockerConfig.restartPolicy || 'always',
        resources: dockerConfig.resources,
        labels: {
          'mcp.managed': 'true',
          'mcp.server.name': server.name,
          'mcp.server.version': server.version,
          'mcp.server.type': server.type,
          'mcp.deployment.id': uuidv4()
        }
      };
      
      // 设置健康检查
      if (dockerConfig.healthCheck) {
        containerConfig.healthCheck = {
          command: dockerConfig.healthCheck.command.split(' '),
          interval: dockerConfig.healthCheck.interval,
          timeout: dockerConfig.healthCheck.timeout,
          retries: dockerConfig.healthCheck.retries,
          startPeriod: dockerConfig.healthCheck.startPeriod
        };
      }
      
      // 设置网络
      if (dockerConfig.useCustomNetwork) {
        const networkName = dockerConfig.networkName || 'mcp-network';
        
        // 确保网络存在
        const networkExists = await this.runtime.createNetwork(networkName);
        if (networkExists) {
          containerConfig.network = {
            name: networkName
          };
        }
      }
      
      // 启动容器
      progressCallback?.('部署', '正在启动Docker容器', 60);
      const containerInfo = await this.runtime.runContainer(server, containerConfig);
      
      // 等待容器启动
      progressCallback?.('启动', '正在等待容器启动', 80);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查容器健康状态
      if (dockerConfig.healthCheck) {
        progressCallback?.('检查', '正在检查容器健康状态', 90);
        const health = await this.runtime.checkHealth(containerInfo.id);
        
        if (health === 'unhealthy') {
          throw new Error('容器健康检查失败');
        }
      }
      
      // 创建部署ID
      const deploymentId = uuidv4();
      
      // 保存部署信息
      this.deployments.set(deploymentId, {
        containerId: containerInfo.id
      });
      
      progressCallback?.('完成', '容器部署完成', 100);
      
      // 计算访问URL
      let url: string | undefined;
      if (containerInfo.ports && Object.keys(containerInfo.ports).length > 0) {
        const hostPort = Object.keys(containerInfo.ports)[0];
        url = `http://localhost:${hostPort}`;
      }
      
      // 返回部署结果
      return {
        id: deploymentId,
        status: 'success',
        url,
        timestamp: new Date().toISOString(),
        logsUrl: `docker logs -f ${containerInfo.id}`,
        metadata: {
          containerId: containerInfo.id,
          containerName: containerInfo.name,
          image: containerInfo.image,
          ports: containerInfo.ports,
          network: containerInfo.network,
          ipAddress: containerInfo.ipAddress
        }
      };
    } catch (error) {
      // 返回错误结果
      return {
        id: uuidv4(),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        metadata: {
          serverName: server.name,
          serverVersion: server.version,
          providerType: MCPCloudProviderType.DOCKER
        }
      };
    }
  }
  
  /**
   * 更新部署
   * @param deploymentId 部署ID
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  async update(
    deploymentId: string,
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult> {
    try {
      // 获取部署信息
      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        throw new Error(`找不到部署ID: ${deploymentId}`);
      }
      
      progressCallback?.('准备', '正在准备更新容器', 10);
      
      // 停止并删除旧容器
      progressCallback?.('停止', '正在停止并删除旧容器', 30);
      await this.runtime.stopContainer(deployment.containerId);
      await this.runtime.removeContainer(deployment.containerId, true);
      
      // 部署新容器
      progressCallback?.('部署', '正在部署新容器', 50);
      const result = await this.deploy(server, config, (stage, message, progress) => {
        // 调整进度，从50%开始
        const adjustedProgress = 50 + (progress / 2);
        progressCallback?.(stage, message, adjustedProgress);
      });
      
      // 更新部署ID
      if (result.status === 'success') {
        this.deployments.delete(deploymentId);
        this.deployments.set(deploymentId, {
          containerId: result.metadata?.containerId as string
        });
        
        // 返回结果但保持原始部署ID
        return {
          ...result,
          id: deploymentId
        };
      }
      
      return result;
    } catch (error) {
      // 返回错误结果
      return {
        id: deploymentId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        metadata: {
          operation: 'update',
          serverName: server.name,
          serverVersion: server.version,
          providerType: MCPCloudProviderType.DOCKER
        }
      };
    }
  }
  
  /**
   * 删除部署
   * @param deploymentId 部署ID
   */
  async remove(deploymentId: string): Promise<boolean> {
    // 获取部署信息
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      return false;
    }
    
    try {
      // 停止并删除容器
      await this.runtime.stopContainer(deployment.containerId);
      const removed = await this.runtime.removeContainer(deployment.containerId, true);
      
      if (removed) {
        // 删除部署记录
        this.deployments.delete(deploymentId);
      }
      
      return removed;
    } catch (error) {
      console.error(`删除部署失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * 获取部署状态
   * @param deploymentId 部署ID
   */
  async getStatus(deploymentId: string): Promise<MCPDeploymentResult> {
    // 获取部署信息
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      return {
        id: deploymentId,
        status: 'failed',
        error: `找不到部署ID: ${deploymentId}`,
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // 获取容器信息
      const containerInfo = await this.runtime.getContainerInfo(deployment.containerId);
      
      // 判断部署状态
      let status: MCPDeploymentResult['status'];
      if (containerInfo.state === 'running') {
        status = 'success';
      } else if (containerInfo.state === 'restarting') {
        status = 'in-progress';
      } else {
        status = 'failed';
      }
      
      // 计算访问URL
      let url: string | undefined;
      if (containerInfo.ports && Object.keys(containerInfo.ports).length > 0) {
        const hostPort = Object.keys(containerInfo.ports)[0];
        url = `http://localhost:${hostPort}`;
      }
      
      // 返回部署状态
      return {
        id: deploymentId,
        status,
        url,
        timestamp: new Date().toISOString(),
        logsUrl: `docker logs -f ${containerInfo.id}`,
        metadata: {
          containerId: containerInfo.id,
          containerName: containerInfo.name,
          image: containerInfo.image,
          state: containerInfo.state,
          ports: containerInfo.ports,
          network: containerInfo.network,
          ipAddress: containerInfo.ipAddress,
          stats: containerInfo.stats
        }
      };
    } catch (error) {
      // 返回错误结果
      return {
        id: deploymentId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * 获取部署日志
   * @param deploymentId 部署ID
   */
  async getLogs(deploymentId: string): Promise<string> {
    // 获取部署信息
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`找不到部署ID: ${deploymentId}`);
    }
    
    try {
      // 获取容器日志
      return await this.runtime.getContainerLogs(deployment.containerId, {
        tail: 1000,
        timestamps: true
      });
    } catch (error) {
      throw new Error(`获取日志失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 