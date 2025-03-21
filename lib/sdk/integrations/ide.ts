/**
 * IDE集成客户端
 * 为IDE扩展提供与MCP服务器的集成功能
 */

import { MCPIntegrationClient } from '../core/MCPIntegrationClient';
import { IntegrationClientOptions } from '../core/types';
import { IntegrationType } from '../../api/services/IntegrationService';

/**
 * IDE扩展配置
 */
export interface IDEExtensionConfig {
  name: string;
  version: string;
  ideType: 'vscode' | 'intellij' | 'atom' | 'sublime' | 'other';
  features?: string[];
  telemetryEnabled?: boolean;
}

/**
 * 服务器通知配置
 */
export interface ServerNotificationConfig {
  enabled: boolean;
  pollingIntervalSeconds?: number;
  showUpdatePrompt?: boolean;
  autoUpdate?: boolean;
}

/**
 * 代码片段
 */
export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
  fileName?: string;
}

/**
 * IDE集成客户端类
 */
export class IDEIntegrationClient extends MCPIntegrationClient {
  private extension: IDEExtensionConfig;
  private notifications: ServerNotificationConfig;
  
  /**
   * 创建新的IDE集成客户端
   * @param options 客户端配置
   * @param extension 扩展配置
   * @param notifications 通知配置
   */
  constructor(
    options: Omit<IntegrationClientOptions, 'type'>,
    extension: IDEExtensionConfig,
    notifications: ServerNotificationConfig = { enabled: true, pollingIntervalSeconds: 300 }
  ) {
    super({
      ...options,
      type: IntegrationType.IDE
    });
    
    this.extension = extension;
    this.notifications = notifications;
  }
  
  /**
   * 注册IDE扩展
   */
  public async registerExtension(): Promise<boolean> {
    try {
      const response = await this.sendMetrics({
        action: 'register_extension',
        extension: this.extension
      });
      
      return response;
    } catch (error) {
      console.error('注册IDE扩展失败:', error);
      return false;
    }
  }
  
  /**
   * 为特定服务器获取代码片段
   * @param serverKey 服务器Key
   * @param language 编程语言
   */
  public async getCodeSnippets(serverKey: string, language?: string): Promise<CodeSnippet[]> {
    try {
      const serverInfo = await this.getServerMetadata(serverKey);
      
      // 从服务器元数据中提取代码片段
      const snippets = serverInfo.metadata?.snippets || [];
      
      // 根据语言过滤
      if (language) {
        return snippets.filter((snippet: any) => 
          snippet.language === language
        ) as CodeSnippet[];
      }
      
      return snippets as CodeSnippet[];
    } catch (error) {
      console.error('获取代码片段失败:', error);
      return [];
    }
  }
  
  /**
   * 订阅服务器更新
   * @param serverKeys 要订阅的服务器Key数组
   */
  public async subscribeToServerUpdates(serverKeys: string[]): Promise<boolean> {
    if (!this.notifications.enabled) {
      return false;
    }
    
    try {
      const result = await this.sendMetrics({
        action: 'subscribe_updates',
        serverKeys,
        pollingInterval: this.notifications.pollingIntervalSeconds
      });
      
      return result;
    } catch (error) {
      console.error('订阅服务器更新失败:', error);
      return false;
    }
  }
  
  /**
   * 检查服务器更新
   * @param serverKeys 要检查的服务器Key数组
   */
  public async checkServerUpdates(serverKeys: string[]): Promise<Record<string, string>> {
    try {
      // 使用getServerMetadata获取每个服务器的信息
      const updates: Record<string, string> = {};
      
      for (const serverKey of serverKeys) {
        try {
          const info = await this.getServerMetadata(serverKey);
          if (info.version) {
            updates[serverKey] = info.version;
          }
        } catch (err) {
          console.error(`获取服务器 ${serverKey} 更新失败:`, err);
        }
      }
      
      return updates;
    } catch (error) {
      console.error('检查服务器更新失败:', error);
      return {};
    }
  }
  
  /**
   * 发送编辑器状态遥测数据
   * @param data 遥测数据
   */
  public async sendTelemetry(data: Record<string, any>): Promise<boolean> {
    if (!this.extension.telemetryEnabled) {
      return false;
    }
    
    try {
      const telemetryData = {
        ...data,
        ide: this.extension.ideType,
        version: this.extension.version,
        type: 'telemetry'
      };
      
      return await this.sendMetrics(telemetryData);
    } catch (error) {
      console.error('发送遥测数据失败:', error);
      return false;
    }
  }
} 