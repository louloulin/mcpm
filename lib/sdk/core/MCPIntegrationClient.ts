/**
 * MCP集成客户端
 * 提供与MCP服务器集成的核心功能
 */

import { EventEmitter } from 'events';
import { 
  IntegrationClientOptions, 
  ServerInfo, 
  ApiResponse,
  ErrorType,
  IntegrationError,
  EventType,
  EventHandler
} from './types';
import { IntegrationType } from '../../api/services/IntegrationService';

/**
 * MCP集成客户端类
 * 提供与MCP服务器集成的功能
 */
export class MCPIntegrationClient extends EventEmitter {
  private baseUrl: string;
  private apiKey: string;
  private type: IntegrationType;
  private timeout: number;
  private debug: boolean;

  /**
   * 创建新的MCP集成客户端
   * @param options 客户端配置选项
   */
  constructor(options: IntegrationClientOptions) {
    super();
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
    this.apiKey = options.apiKey;
    this.type = options.type;
    this.timeout = options.timeout || 30000; // 默认30秒超时
    this.debug = options.debug || false;
  }

  /**
   * 获取服务器元数据
   * @param serverKey 服务器Key
   */
  public async getServerMetadata(serverKey: string): Promise<ServerInfo> {
    try {
      const endpoint = this.type === IntegrationType.AI_ASSISTANT
        ? `/api/v1/ai/metadata/${serverKey}`
        : `/api/v1/servers/${serverKey}/metadata`;
      
      const response = await this.request<ServerInfo>(endpoint, {
        method: 'GET'
      });

      if (!response.success || !response.data) {
        throw new IntegrationError(
          response.error || '获取服务器元数据失败',
          ErrorType.SERVER_ERROR
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        `获取服务器元数据失败: ${error instanceof Error ? error.message : String(error)}`,
        ErrorType.NETWORK_ERROR
      );
    }
  }

  /**
   * 获取服务器工具列表
   * @param serverKey 服务器Key
   */
  public async getServerTools(serverKey: string): Promise<any[]> {
    const metadata = await this.getServerMetadata(serverKey);
    return metadata.tools || [];
  }

  /**
   * 验证API密钥
   */
  public async verifyApiKey(): Promise<boolean> {
    try {
      const response = await this.request<{ valid: boolean }>('/api/v1/integrations/verify-key', {
        method: 'POST'
      });

      return response.success && response.data?.valid === true;
    } catch (error) {
      this.log('API密钥验证失败:', error);
      return false;
    }
  }

  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param handler 事件处理函数
   */
  public onEvent<T = any>(event: EventType, handler: EventHandler<T>): this {
    this.on(event, handler);
    return this;
  }

  /**
   * 发送集成指标数据
   * @param metrics 指标数据
   */
  public async sendMetrics(metrics: Record<string, any>): Promise<boolean> {
    try {
      const response = await this.request('/api/v1/integrations/metrics', {
        method: 'POST',
        body: JSON.stringify(metrics)
      });

      return response.success;
    } catch (error) {
      this.log('发送指标数据失败:', error);
      return false;
    }
  }

  /**
   * 执行HTTP请求
   * @param endpoint API端点
   * @param options 请求选项
   */
  private async request<T = any>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    
    // 添加API密钥和内容类型
    headers.set('X-MCP-Api-Key', this.apiKey);
    if (!headers.has('Content-Type') && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 解析JSON响应
      const data = await response.json();
      
      if (!response.ok) {
        throw new IntegrationError(
          data.error || data.message || `请求失败: ${response.status}`,
          response.status === 401 ? ErrorType.AUTHENTICATION_ERROR : ErrorType.SERVER_ERROR,
          response.status,
          data
        );
      }
      
      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      
      // 超时错误
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new IntegrationError(
          '请求超时',
          ErrorType.NETWORK_ERROR
        );
      }
      
      // 其他网络错误
      throw new IntegrationError(
        `请求失败: ${error instanceof Error ? error.message : String(error)}`,
        ErrorType.NETWORK_ERROR
      );
    }
  }

  /**
   * 打印调试日志
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[MCP Integration]', ...args);
    }
  }
} 