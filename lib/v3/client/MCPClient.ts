/**
 * MCPM 3.0 客户端
 * 提供简化的MCP服务访问API
 */

import { createToolProxy, validateToolParams } from './tool-proxy';
import { MCPClientOptions, ServiceMetadata, ToolCallResult, ToolProxy } from './types';

/**
 * MCP客户端
 * 简化的MCP服务调用接口
 */
export class MCPClient {
  /** 客户端配置选项 */
  private options: Required<MCPClientOptions>;
  
  /** 服务元数据缓存 */
  private metadataCache: Map<string, ServiceMetadata> = new Map();
  
  /** 工具代理对象 */
  public tools: ToolProxy;
  
  /**
   * 创建MCP客户端实例
   * @param options 客户端配置选项
   */
  constructor(options: MCPClientOptions = {}) {
    // 设置默认选项
    this.options = {
      registry: options.registry || 'https://registry.mcpm.io',
      credentials: options.credentials || '',
      autoDiscovery: options.autoDiscovery || false,
      cacheStrategy: options.cacheStrategy || 'memory',
      timeout: options.timeout || 30000,
      debug: options.debug || false
    };
    
    // 创建工具代理
    this.tools = createToolProxy(
      this.fetchServiceMetadata.bind(this),
      this.executeToolCall.bind(this)
    );
    
    // 初始化
    this.initialize();
  }
  
  /**
   * 初始化客户端
   */
  private async initialize(): Promise<void> {
    if (this.options.autoDiscovery) {
      try {
        await this.discoverServices();
      } catch (error) {
        this.log('自动发现服务失败:', error);
      }
    }
  }
  
  /**
   * 发现可用服务
   */
  public async discoverServices(): Promise<string[]> {
    try {
      const response = await this.request('/api/v1/services', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`服务发现失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const services = data.services || [];
      
      // 预加载服务元数据
      for (const service of services) {
        try {
          const metadata = await this.fetchServiceMetadata(service.id);
          this.metadataCache.set(service.id, metadata);
        } catch (error) {
          this.log(`加载服务 ${service.id} 元数据失败:`, error);
        }
      }
      
      return services.map((service: any) => service.id);
    } catch (error) {
      this.log('服务发现请求失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取服务元数据
   * @param serviceId 服务ID
   */
  public async fetchServiceMetadata(serviceId: string): Promise<ServiceMetadata> {
    // 检查缓存
    if (this.metadataCache.has(serviceId)) {
      return this.metadataCache.get(serviceId)!;
    }
    
    try {
      const response = await this.request(`/api/v1/services/${serviceId}/metadata`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`获取服务元数据失败: ${response.status} ${response.statusText}`);
      }
      
      const metadata = await response.json();
      
      // 验证元数据
      if (!metadata.id || !metadata.name || !metadata.tools) {
        throw new Error(`服务 ${serviceId} 返回的元数据格式无效`);
      }
      
      // 缓存元数据
      this.metadataCache.set(serviceId, metadata);
      
      return metadata;
    } catch (error) {
      this.log(`获取服务 ${serviceId} 元数据失败:`, error);
      throw error;
    }
  }
  
  /**
   * 执行工具调用
   * @param serviceId 服务ID
   * @param toolName 工具名称
   * @param params 调用参数
   */
  public async executeToolCall(
    serviceId: string,
    toolName: string,
    params: any
  ): Promise<ToolCallResult> {
    try {
      // 获取服务元数据
      const metadata = await this.fetchServiceMetadata(serviceId);
      
      // 查找工具定义
      const tool = metadata.tools.find(t => t.name === toolName);
      if (!tool) {
        return {
          success: false,
          error: `工具 "${toolName}" 在服务 "${serviceId}" 中不存在`
        };
      }
      
      // 验证参数
      const validationResult = validateToolParams(tool, params);
      if (validationResult !== true) {
        return {
          success: false,
          error: validationResult
        };
      }
      
      // 构建请求URL
      const endpoint = metadata.endpoint || `/api/v1/services/${serviceId}/tools/${toolName}`;
      
      // 发送请求
      const startTime = Date.now();
      const response = await this.request(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      const executionTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `请求失败: ${response.status} ${response.statusText}`,
          metadata: {
            requestId: response.headers.get('X-Request-ID') || undefined,
            executionTime,
            serviceId
          }
        };
      }
      
      // 解析响应
      const data = await response.json();
      
      return {
        success: true,
        data,
        metadata: {
          requestId: response.headers.get('X-Request-ID') || undefined,
          executionTime,
          serviceId
        }
      };
    } catch (error) {
      this.log(`执行工具 ${serviceId}.${toolName} 调用失败:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 发送HTTP请求
   * @param path 请求路径
   * @param options 请求选项
   */
  private async request(path: string, options: RequestInit): Promise<Response> {
    const url = path.startsWith('http')
      ? path
      : `${this.options.registry}${path.startsWith('/') ? path : `/${path}`}`;
    
    const headers = new Headers(options.headers);
    
    // 添加授权头
    if (this.options.credentials) {
      headers.set('Authorization', `Bearer ${this.options.credentials}`);
    }
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * 清除缓存
   * @param serviceId 可选，指定要清除的服务ID；不提供则清除所有缓存
   */
  public clearCache(serviceId?: string): void {
    if (serviceId) {
      this.metadataCache.delete(serviceId);
    } else {
      this.metadataCache.clear();
    }
  }
  
  /**
   * 输出调试日志
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[MCPClient]', ...args);
    }
  }
} 