/**
 * MCP集成服务
 * 提供与IDE、AI助手和其他第三方系统的集成接口
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { db } from '../../database';
import { eq, and } from 'drizzle-orm';
import { integrations, servers, Integration } from '../../database/schema';

// 集成类型
export enum IntegrationType {
  IDE = 'ide',            // 集成IDE (VS Code, JetBrains, etc.)
  AI_ASSISTANT = 'ai',    // 集成AI助手
  CI_CD = 'cicd',         // 集成CI/CD系统
  CHAT_PLATFORM = 'chat', // 集成聊天平台
  CUSTOM = 'custom'       // 自定义集成
}

// 集成配置接口
export interface IntegrationConfig {
  id?: string;                 // 集成ID
  name: string;                // 集成名称
  type: IntegrationType;       // 集成类型
  apiKey?: string;            // API密钥
  webhookUrl?: string | null; // Webhook URL
  settings: Record<string, any>; // 特定集成的设置
  userId: string;              // 所有者用户ID
  enabled: boolean;            // 是否启用
  createdAt?: Date | null;    // 创建时间
  updatedAt?: Date | null;    // 更新时间
}

// 集成响应接口
export interface IntegrationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * 集成服务类
 * 管理所有第三方集成
 */
export class IntegrationService extends EventEmitter {
  private static instance: IntegrationService;

  /**
   * 获取IntegrationService单例
   */
  public static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  private constructor() {
    super();
  }

  /**
   * 将数据库集成记录转换为配置对象
   */
  private toIntegrationConfig(record: Integration): IntegrationConfig {
    return {
      id: record.id,
      name: record.name,
      type: record.type as IntegrationType,
      apiKey: record.apiKey,
      webhookUrl: record.webhookUrl,
      settings: typeof record.settings === 'string' 
        ? JSON.parse(record.settings) 
        : record.settings,
      userId: record.userId,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  /**
   * 创建新的集成配置
   * @param config 集成配置
   */
  public async createIntegration(config: Omit<IntegrationConfig, 'apiKey'>): Promise<IntegrationConfig> {
    // 生成API密钥
    const apiKey = this.generateApiKey();
    
    // 创建集成记录
    const newIntegration = await db.insert(integrations).values({
      name: config.name,
      type: config.type,
      apiKey,
      webhookUrl: config.webhookUrl,
      settings: JSON.stringify(config.settings),
      userId: config.userId,
      enabled: config.enabled ?? true
    }).returning();
    
    return this.toIntegrationConfig(newIntegration[0]);
  }

  /**
   * 获取用户的所有集成
   * @param userId 用户ID
   */
  public async getUserIntegrations(userId: string): Promise<IntegrationConfig[]> {
    const results = await db.select().from(integrations).where(eq(integrations.userId, userId));
    
    return results.map(integration => this.toIntegrationConfig(integration));
  }

  /**
   * 更新集成配置
   * @param id 集成ID
   * @param config 更新的配置
   */
  public async updateIntegration(id: string, config: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    // 防止更新apiKey
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey, settings, ...otherData } = config;
    
    // 准备更新数据
    const updateData: any = { ...otherData };
    
    // 如果有设置，转换为JSON字符串
    if (settings) {
      updateData.settings = JSON.stringify(settings);
    }

    const updated = await db.update(integrations)
      .set(updateData)
      .where(eq(integrations.id, id))
      .returning();
    
    return this.toIntegrationConfig(updated[0]);
  }

  /**
   * 删除集成
   * @param id 集成ID
   */
  public async deleteIntegration(id: string): Promise<boolean> {
    const deleted = await db.delete(integrations)
      .where(eq(integrations.id, id))
      .returning();
    
    if (deleted.length > 0) {
      this.emit('integration.deleted', deleted[0]);
      return true;
    }
    
    return false;
  }

  /**
   * 重新生成API密钥
   * @param id 集成ID
   */
  public async regenerateApiKey(id: string): Promise<string> {
    const apiKey = this.generateApiKey();

    await db.update(integrations)
      .set({ apiKey })
      .where(eq(integrations.id, id));

    return apiKey;
  }

  /**
   * 验证API密钥
   * @param apiKey API密钥
   */
  public async validateApiKey(apiKey: string): Promise<IntegrationConfig | null> {
    const results = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.apiKey, apiKey),
        eq(integrations.enabled, true)
      ));
    
    if (results.length === 0) {
      return null;
    }
    
    return this.toIntegrationConfig(results[0]);
  }

  /**
   * IDE集成 - 发送服务器更新通知
   * @param integrationId 集成ID
   * @param serverId 服务器ID
   */
  public async notifyIdeServerUpdate(integrationId: string, serverId: string): Promise<IntegrationResponse> {
    const integrationResults = await db.select()
      .from(integrations)
      .where(eq(integrations.id, integrationId));
    
    if (integrationResults.length === 0) {
      return { success: false, message: '集成不存在' };
    }
    
    const integration = integrationResults[0];

    if (integration.type !== IntegrationType.IDE) {
      return { success: false, message: '无效的IDE集成' };
    }

    if (!integration.webhookUrl) {
      return { success: false, message: '未配置Webhook URL' };
    }

    // 获取服务器数据
    const serverResults = await db.select()
      .from(servers)
      .where(eq(servers.id, serverId));
    
    if (serverResults.length === 0) {
      return { success: false, message: '服务器不存在' };
    }
    
    const server = serverResults[0];

    // 发送webhook通知
    try {
      const response = await fetch(integration.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MCP-Api-Key': integration.apiKey
        },
        body: JSON.stringify({
          event: 'server.updated',
          data: {
            serverId: server.id,
            name: server.name,
            key: server.key,
            version: server.version
          }
        })
      });

      if (!response.ok) {
        return { 
          success: false, 
          message: `Webhook请求失败: ${response.status}` 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Webhook请求异常: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * AI助手集成 - 获取服务器元数据
   * @param apiKey API密钥
   * @param serverKey 服务器Key
   */
  public async getServerMetadataForAI(apiKey: string, serverKey: string): Promise<IntegrationResponse> {
    // 验证API密钥
    const integration = await this.validateApiKey(apiKey);
    
    if (!integration || integration.type !== IntegrationType.AI_ASSISTANT) {
      return { success: false, message: '无效的AI助手集成API密钥' };
    }

    // 获取服务器数据
    const serverResults = await db.select()
      .from(servers)
      .where(eq(servers.key, serverKey));
    
    if (serverResults.length === 0) {
      return { success: false, message: '服务器不存在' };
    }
    
    const server = serverResults[0];

    // TODO: 获取服务器工具和元数据
    const toolData: any[] = []; // 从数据库获取
    const metadataObj: Record<string, any> = {}; // 从数据库获取

    return {
      success: true,
      data: {
        id: server.id,
        name: server.name,
        key: server.key,
        description: server.description,
        version: server.version,
        tools: toolData,
        metadata: metadataObj
      }
    };
  }

  /**
   * 生成API密钥
   */
  private generateApiKey(): string {
    return `mcp_${crypto.randomBytes(16).toString('hex')}`;
  }
}

export default IntegrationService; 