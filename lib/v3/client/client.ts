/**
 * MCPM 3.0 客户端实现
 * 提供简化的MCP服务调用API
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MCPClientOptions, MCPServerInfo, ToolCallOptions, ToolCallResult } from './types';
import { MCPTool } from '../../mcp/types';

/**
 * 内存缓存存储
 */
class MemoryCache {
  private data: Map<string, { value: any; expiry: number }> = new Map();

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.data.set(key, { value, expiry });
  }

  /**
   * 获取缓存
   */
  get(key: string): any {
    const item = this.data.get(key);
    if (!item) return null;

    // 检查是否过期
    if (item.expiry < Date.now()) {
      this.data.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.data.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.data.clear();
  }
}

/**
 * MCP客户端
 * 提供简化的MCP服务调用API
 */
export class MCPClient {
  private axios: AxiosInstance;
  private options: MCPClientOptions;
  private cache: MemoryCache | null;
  private serverInfo: MCPServerInfo | null = null;
  private toolsProxy: any = {};

  /**
   * 创建MCP客户端
   * @param options 客户端配置选项
   */
  constructor(options: MCPClientOptions = {}) {
    // 默认配置
    this.options = {
      registry: 'https://registry.mcpm.io',
      autoDiscovery: false,
      cacheStrategy: 'memory',
      cacheTTL: 5 * 60 * 1000, // 5分钟
      timeout: 10000, // 10秒
      retry: {
        maxRetries: 3,
        delay: 1000,
        factor: 2
      },
      debug: false,
      ...options
    };

    // 创建HTTP客户端
    this.axios = axios.create({
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPM-Client/3.0',
        ...this.options.headers
      }
    });

    // 设置认证信息
    if (this.options.credentials) {
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${this.options.credentials}`;
    }

    // 设置缓存
    if (this.options.cacheStrategy === 'memory') {
      this.cache = new MemoryCache();
    } else {
      this.cache = null;
    }

    // 创建工具代理
    this.tools = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }
        
        // 如果工具代理已存在，则返回
        if (prop in this.toolsProxy) {
          return this.toolsProxy[prop as string];
        }
        
        // 否则创建新的工具代理
        const toolProxy = this.createToolProxy(prop as string);
        this.toolsProxy[prop as string] = toolProxy;
        return toolProxy;
      }
    });
  }

  /**
   * 工具代理
   * 动态访问MCP服务的工具
   */
  public tools: Record<string, any>;

  /**
   * 连接到服务器
   * @param url 服务器URL，如果未提供则使用配置
   */
  async connect(url?: string): Promise<MCPServerInfo> {
    const serverUrl = url || this.options.server;
    
    if (!serverUrl) {
      throw new Error('未提供服务器URL');
    }
    
    try {
      const normalizedUrl = serverUrl.endsWith('/')
        ? serverUrl.slice(0, -1)
        : serverUrl;
        
      const metadataUrl = `${normalizedUrl}/api/metadata`;
      
      // 从缓存获取
      const cacheKey = `server_info:${metadataUrl}`;
      if (this.cache) {
        const cachedInfo = this.cache.get(cacheKey);
        if (cachedInfo) {
          this.serverInfo = cachedInfo;
          this.debug('从缓存获取服务器信息');
          return cachedInfo;
        }
      }
      
      // 发起请求
      this.debug(`正在连接服务器: ${metadataUrl}`);
      const response = await this.axios.get(metadataUrl);
      
      if (response.status === 200 && response.data) {
        const info: MCPServerInfo = {
          name: response.data.name,
          version: response.data.version,
          description: response.data.description,
          url: normalizedUrl,
          tools: response.data.tools || [],
          endpoint: response.data.endpoint || `${normalizedUrl}/api/tools`,
          authenticationTypes: response.data.authenticationTypes || ['none']
        };
        
        // 缓存结果
        if (this.cache) {
          this.cache.set(cacheKey, info, this.options.cacheTTL!);
        }
        
        this.serverInfo = info;
        this.debug(`已连接到服务器: ${info.name}@${info.version}`);
        return info;
      } else {
        throw new Error('无效的服务器响应');
      }
    } catch (error) {
      this.debug('连接服务器失败', error);
      throw error instanceof Error
        ? error
        : new Error('连接服务器失败');
    }
  }

  /**
   * 获取服务信息
   */
  async getServerInfo(): Promise<MCPServerInfo> {
    if (this.serverInfo) {
      return this.serverInfo;
    }
    
    return this.connect();
  }
  
  /**
   * 获取工具列表
   */
  async getTools(): Promise<MCPTool[]> {
    const info = await this.getServerInfo();
    return info.tools || [];
  }
  
  /**
   * 通用工具调用方法
   * @param toolName 工具名称
   * @param params 工具参数
   * @param options 调用选项
   */
  async callTool<TParams = any, TResult = any>(
    toolName: string,
    params: TParams,
    options: ToolCallOptions = {}
  ): Promise<ToolCallResult<TResult>> {
    try {
      // 确保已连接
      if (!this.serverInfo) {
        await this.connect();
      }
      
      if (!this.serverInfo) {
        throw new Error('未连接到服务器');
      }
      
      // 构建请求URL
      const endpoint = this.serverInfo.endpoint.endsWith('/')
        ? this.serverInfo.endpoint
        : `${this.serverInfo.endpoint}/`;
        
      const toolUrl = `${endpoint}${toolName}`;
      
      // 构建请求配置
      const requestConfig: AxiosRequestConfig = {
        timeout: options.timeout || this.options.timeout,
        headers: {
          ...this.options.headers,
          ...options.headers
        }
      };
      
      // 计算缓存键
      const cacheKey = `tool_call:${toolUrl}:${JSON.stringify(params)}`;
      
      // 检查缓存
      if (this.cache && options.cache !== 'skip') {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
          // 添加缓存元数据
          cachedResult.metadata = {
            ...cachedResult.metadata,
            cache: {
              hit: true,
              time: Date.now()
            }
          };
          
          this.debug(`从缓存获取工具调用结果: ${toolName}`);
          return cachedResult;
        }
      }
      
      // 执行回调
      if (options.onRequest) {
        options.onRequest({
          url: toolUrl,
          method: 'POST',
          params,
          config: requestConfig
        });
      }
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 发送请求
      this.debug(`调用工具: ${toolName}`, params);
      const response = await this.axios.post(toolUrl, params, requestConfig);
      
      // 计算执行时间
      const executionTime = Date.now() - startTime;
      
      // 处理响应
      const result: ToolCallResult<TResult> = {
        success: response.data.success === true,
        data: response.data.data,
        error: response.data.error,
        metadata: {
          executionTime,
          requestId: response.headers['x-request-id'],
          server: this.serverInfo.name,
          tool: toolName,
          cache: {
            hit: false
          }
        }
      };
      
      // 执行回调
      if (options.onResponse) {
        options.onResponse({
          response,
          result
        });
      }
      
      // 缓存结果
      if (this.cache && result.success) {
        this.cache.set(cacheKey, result, this.options.cacheTTL!);
      }
      
      return result;
    } catch (error) {
      // 处理错误
      this.debug(`工具调用错误: ${toolName}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '调用工具失败',
        metadata: {
          executionTime: 0,
          server: this.serverInfo?.name,
          tool: toolName
        }
      };
    }
  }
  
  /**
   * 创建工具代理
   * @param toolName 工具名称
   */
  private createToolProxy(toolName: string): any {
    // 创建基本代理对象
    const basicProxy = (params: any, options?: ToolCallOptions) => {
      return this.callTool(toolName, params, options);
    };
    
    // 返回带有方法代理的增强对象
    return new Proxy(basicProxy, {
      get: (target, prop) => {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined;
        }
        
        // 创建方法调用代理
        return (params: any, options?: ToolCallOptions) => {
          const fullToolName = `${toolName}.${String(prop)}`;
          return this.callTool(fullToolName, params, options);
        };
      }
    });
  }
  
  /**
   * 输出调试信息
   */
  private debug(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[MCPClient] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
      this.debug('已清除缓存');
    }
  }
  
  /**
   * 关闭客户端
   */
  close(): void {
    this.clearCache();
    this.serverInfo = null;
    this.toolsProxy = {};
    this.debug('客户端已关闭');
  }
} 