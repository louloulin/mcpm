/**
 * MCP云托管管理器
 * 
 * 负责管理不同的云提供者，以实现MCP服务器的云端部署和管理
 */
import { MCPServerDefinition, MCPCloudHostingConfig, MCPDeploymentResult, MCPCloudProviderType } from '../types';
import { CloudProvider, DeploymentProgressCallback } from './types';

/**
 * MCP云托管管理器类
 * 管理多个云提供者，提供统一的托管接口
 */
export class MCPCloudHostingManager {
  // 存储注册的云提供者
  private providers: Map<MCPCloudProviderType, CloudProvider> = new Map();
  
  /**
   * 注册云提供者
   * @param provider 云提供者实例
   */
  registerProvider(provider: CloudProvider): void {
    this.providers.set(provider.type, provider);
  }
  
  /**
   * 检查是否有指定类型的云提供者
   * @param type 云提供者类型
   * @returns 是否已注册
   */
  hasProvider(type: MCPCloudProviderType): boolean {
    return this.providers.has(type);
  }
  
  /**
   * 获取指定类型的云提供者
   * @param type 云提供者类型
   * @returns 云提供者实例
   * @throws 如果未找到提供者
   */
  getProvider(type: MCPCloudProviderType): CloudProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Cloud provider not registered: ${type}`);
    }
    return provider;
  }
  
  /**
   * 部署MCP服务器到云端
   * @param server 服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   * @returns 部署结果
   */
  async deploy(
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult> {
    const provider = this.getProvider(config.providerType);
    return await provider.deploy(server, config, progressCallback);
  }
  
  /**
   * 更新云端部署的MCP服务器
   * @param deploymentId 部署ID
   * @param server 更新后的服务器定义
   * @param config 托管配置
   * @param progressCallback 进度回调
   * @returns 部署结果
   */
  async update(
    deploymentId: string,
    server: MCPServerDefinition,
    config: MCPCloudHostingConfig,
    progressCallback?: DeploymentProgressCallback
  ): Promise<MCPDeploymentResult> {
    const provider = this.getProvider(config.providerType);
    return await provider.update(deploymentId, server, config, progressCallback);
  }
  
  /**
   * 删除云端部署
   * @param deploymentId 部署ID
   * @param providerType 云提供者类型
   * @returns 是否成功
   */
  async remove(deploymentId: string, providerType: MCPCloudProviderType): Promise<boolean> {
    const provider = this.getProvider(providerType);
    return await provider.remove(deploymentId);
  }
  
  /**
   * 获取部署状态
   * @param deploymentId 部署ID
   * @param providerType 云提供者类型
   * @returns 部署结果
   */
  async getStatus(deploymentId: string, providerType: MCPCloudProviderType): Promise<MCPDeploymentResult> {
    const provider = this.getProvider(providerType);
    return await provider.getStatus(deploymentId);
  }
  
  /**
   * 获取部署日志
   * @param deploymentId 部署ID
   * @param providerType 云提供者类型
   * @returns 日志内容
   */
  async getLogs(deploymentId: string, providerType: MCPCloudProviderType): Promise<string> {
    const provider = this.getProvider(providerType);
    return await provider.getLogs(deploymentId);
  }
}

// 创建并导出单例实例
export const cloudHostingManager = new MCPCloudHostingManager(); 