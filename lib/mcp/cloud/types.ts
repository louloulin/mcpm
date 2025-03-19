/**
 * MCP云托管模块类型定义
 */
import { MCPServerDefinition, MCPCloudHostingConfig, MCPCloudProviderType, MCPDeploymentResult } from '../types';

/**
 * 部署进度回调
 */
export type DeploymentProgressCallback = (
  stage: string, 
  message: string, 
  progress: number
) => void;

/**
 * 云提供者凭证接口
 */
export interface CloudProviderCredentials {
  [key: string]: string | number | boolean | undefined;
}

/**
 * AWS Lambda凭证
 */
export interface AWSCredentials extends CloudProviderCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Vercel凭证
 */
export interface VercelCredentials extends CloudProviderCredentials {
  token: string;
  teamId?: string;
}

/**
 * Cloudflare凭证
 */
export interface CloudflareCredentials extends CloudProviderCredentials {
  apiToken: string;
  accountId: string;
}

/**
 * 自托管服务器凭证
 */
export interface SelfHostedCredentials extends CloudProviderCredentials {
  host: string;
  username: string;
  privateKey?: string;
  password?: string;
  port?: number;
}

/**
 * Docker凭证
 */
export interface DockerCredentials extends CloudProviderCredentials {
  registryUrl?: string;
  username?: string;
  password?: string;
  configFile?: string;
}

/**
 * 云提供者配置
 */
export interface CloudProviderConfig {
  // 提供者类型
  type: MCPCloudProviderType;
  // 提供者凭证
  credentials: CloudProviderCredentials;
  // 提供者特定配置
  options?: Record<string, any>;
}

/**
 * 云提供者接口
 */
export interface CloudProvider {
  // 提供者类型
  readonly type: MCPCloudProviderType;
  
  /**
   * 部署服务器
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  deploy(
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  /**
   * 更新部署
   * @param deploymentId 部署ID
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  update(
    deploymentId: string,
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  /**
   * 删除部署
   * @param deploymentId 部署ID
   */
  remove(deploymentId: string): Promise<boolean>;
  
  /**
   * 获取部署状态
   * @param deploymentId 部署ID
   */
  getStatus(deploymentId: string): Promise<MCPDeploymentResult>;
  
  /**
   * 获取部署日志
   * @param deploymentId 部署ID
   */
  getLogs(deploymentId: string): Promise<string>;
}

/**
 * 云托管管理器接口
 */
export interface CloudHostingManager {
  /**
   * 注册云提供者
   * @param provider 云提供者
   */
  registerProvider(provider: CloudProvider): void;
  
  /**
   * 获取云提供者
   * @param type 提供者类型
   */
  getProvider(type: MCPCloudProviderType): CloudProvider | undefined;
  
  /**
   * 部署服务器
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  deploy(
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  /**
   * 更新部署
   * @param deploymentId 部署ID
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   */
  update(
    deploymentId: string,
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult>;
  
  /**
   * 删除部署
   * @param deploymentId 部署ID
   */
  remove(deploymentId: string): Promise<boolean>;
  
  /**
   * 获取部署状态
   * @param deploymentId 部署ID
   * @param providerType 提供者类型
   */
  getStatus(
    deploymentId: string,
    providerType: MCPCloudProviderType
  ): Promise<MCPDeploymentResult>;
  
  /**
   * 获取部署日志
   * @param deploymentId 部署ID
   * @param providerType 提供者类型
   */
  getLogs(
    deploymentId: string, 
    providerType: MCPCloudProviderType
  ): Promise<string>;
} 