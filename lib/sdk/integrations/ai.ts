/**
 * AI助手集成客户端
 * 为AI助手提供与MCP服务器的集成功能
 */

import { MCPIntegrationClient } from '../core/MCPIntegrationClient';
import { IntegrationClientOptions } from '../core/types';
import { IntegrationType } from '../../api/services/IntegrationService';

/**
 * AI助手配置
 */
export interface AIAssistantConfig {
  name: string;
  version: string;
  assistantType: 'chatbot' | 'copilot' | 'agent' | 'other';
  capabilities?: string[];
  telemetryEnabled?: boolean;
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required_parameters?: string[];
  schema_version?: string;
}

/**
 * 工具调用请求
 */
export interface ToolCallRequest {
  toolName: string;
  parameters: Record<string, any>;
  callId: string;
}

/**
 * 工具调用响应
 */
export interface ToolCallResponse {
  callId: string;
  result: any;
  error?: string;
  statusCode?: number;
}

/**
 * 会话上下文
 */
export interface SessionContext {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * AI助手集成客户端类
 */
export class AIAssistantClient extends MCPIntegrationClient {
  private assistant: AIAssistantConfig;
  
  /**
   * 创建新的AI助手集成客户端
   * @param options 客户端配置
   * @param assistant 助手配置
   */
  constructor(
    options: Omit<IntegrationClientOptions, 'type'>,
    assistant: AIAssistantConfig
  ) {
    super({
      ...options,
      type: IntegrationType.AI_ASSISTANT
    });
    
    this.assistant = assistant;
  }
  
  /**
   * 注册AI助手
   */
  public async registerAssistant(): Promise<boolean> {
    try {
      const response = await this.sendMetrics({
        action: 'register_assistant',
        assistant: this.assistant
      });
      
      return response;
    } catch (error) {
      console.error('注册AI助手失败:', error);
      return false;
    }
  }
  
  /**
   * 为特定服务器获取可用工具列表
   * @param serverKey 服务器Key
   */
  public async getAvailableTools(serverKey: string): Promise<ToolDefinition[]> {
    try {
      const serverInfo = await this.getServerMetadata(serverKey);
      return serverInfo.tools || [];
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return [];
    }
  }
  
  /**
   * 调用MCP服务器上的工具
   * @param serverKey 服务器Key
   * @param request 工具调用请求
   * @param context 会话上下文
   */
  public async callTool(
    serverKey: string, 
    request: ToolCallRequest, 
    context?: SessionContext
  ): Promise<ToolCallResponse> {
    try {
      // 使用sendMetrics方法发送工具调用请求
      const response = await this.sendMetrics({
        action: 'tool_call',
        serverKey,
        toolName: request.toolName,
        parameters: request.parameters,
        callId: request.callId,
        session: context
      });
      
      if (!response) {
        return {
          callId: request.callId,
          result: null,
          error: '工具调用失败',
          statusCode: 500
        };
      }
      
      return {
        callId: request.callId,
        result: response,
        statusCode: 200
      };
    } catch (error) {
      console.error('工具调用失败:', error);
      return {
        callId: request.callId,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        statusCode: 500
      };
    }
  }
  
  /**
   * 批量调用工具
   * @param serverKey 服务器Key
   * @param requests 工具调用请求数组
   * @param context 会话上下文
   */
  public async batchCallTools(
    serverKey: string,
    requests: ToolCallRequest[],
    context?: SessionContext
  ): Promise<ToolCallResponse[]> {
    const responses: ToolCallResponse[] = [];
    
    for (const request of requests) {
      try {
        const response = await this.callTool(serverKey, request, context);
        responses.push(response);
      } catch (error) {
        responses.push({
          callId: request.callId,
          result: null,
          error: error instanceof Error ? error.message : String(error),
          statusCode: 500
        });
      }
    }
    
    return responses;
  }
  
  /**
   * 获取服务器模型配置
   * @param serverKey 服务器Key
   */
  public async getModelConfig(serverKey: string): Promise<Record<string, any>> {
    try {
      const serverInfo = await this.getServerMetadata(serverKey);
      return serverInfo.metadata?.modelConfig || {};
    } catch (error) {
      console.error('获取模型配置失败:', error);
      return {};
    }
  }
  
  /**
   * 发送使用情况遥测数据
   * @param data 遥测数据
   */
  public async sendUsageStats(data: Record<string, any>): Promise<boolean> {
    if (!this.assistant.telemetryEnabled) {
      return false;
    }
    
    try {
      const telemetryData = {
        ...data,
        assistant: this.assistant.name,
        version: this.assistant.version,
        type: 'usage_stats'
      };
      
      return await this.sendMetrics(telemetryData);
    } catch (error) {
      console.error('发送使用情况统计失败:', error);
      return false;
    }
  }
} 