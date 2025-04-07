/**
 * MCPM 3.0 客户端类型定义
 */

import { MCPTool } from '../../mcp/types';

/**
 * MCP客户端配置选项
 */
export interface MCPClientOptions {
  /**
   * 注册表URL
   * 默认为官方MCPM注册表
   */
  registry?: string;
  
  /**
   * 服务器URL
   * 直接连接的MCP服务器，优先于注册表
   */
  server?: string;
  
  /**
   * 认证凭据
   * 可以是API密钥或OAuth2令牌
   */
  credentials?: string;
  
  /**
   * 自动发现服务器
   * 如果为true，将自动从注册表中查找服务
   */
  autoDiscovery?: boolean;
  
  /**
   * 缓存策略
   * - none: 不缓存
   * - memory: 内存缓存
   * - persistent: 持久化缓存
   */
  cacheStrategy?: 'none' | 'memory' | 'persistent';
  
  /**
   * 缓存过期时间（毫秒）
   * 默认为5分钟
   */
  cacheTTL?: number;
  
  /**
   * 请求超时（毫秒）
   * 默认为10秒
   */
  timeout?: number;
  
  /**
   * 重试配置
   */
  retry?: {
    /**
     * 最大重试次数
     * 默认为3次
     */
    maxRetries?: number;
    
    /**
     * 重试延迟（毫秒）
     * 默认为1000毫秒
     */
    delay?: number;
    
    /**
     * 重试因子
     * 每次重试后延迟乘以此因子
     * 默认为2
     */
    factor?: number;
  };
  
  /**
   * 自定义请求头
   */
  headers?: Record<string, string>;
  
  /**
   * 调试模式
   */
  debug?: boolean;
}

/**
 * 工具调用选项
 */
export interface ToolCallOptions {
  /**
   * 请求超时（毫秒）
   * 覆盖全局超时设置
   */
  timeout?: number;
  
  /**
   * 重试次数
   * 覆盖全局重试设置
   */
  retries?: number;
  
  /**
   * 缓存选项
   * - skip: 跳过缓存
   * - force: 强制使用缓存
   */
  cache?: 'skip' | 'force';
  
  /**
   * 请求头
   * 与全局头合并
   */
  headers?: Record<string, string>;
  
  /**
   * 请求回调
   * 在请求发送前调用
   */
  onRequest?: (request: any) => void;
  
  /**
   * 响应回调
   * 在收到响应后调用
   */
  onResponse?: (response: any) => void;
}

/**
 * MCP服务器信息
 */
export interface MCPServerInfo {
  /**
   * 服务器名称
   */
  name: string;
  
  /**
   * 服务器版本
   */
  version: string;
  
  /**
   * 服务器描述
   */
  description?: string;
  
  /**
   * 服务器URL
   */
  url: string;
  
  /**
   * 服务器工具列表
   */
  tools: MCPTool[];
  
  /**
   * API端点
   */
  endpoint: string;
  
  /**
   * 认证类型
   */
  authenticationTypes?: string[];
}

/**
 * 工具调用结果
 */
export interface ToolCallResult<T = any> {
  /**
   * 是否成功
   */
  success: boolean;
  
  /**
   * 结果数据
   * 成功时存在
   */
  data?: T;
  
  /**
   * 错误信息
   * 失败时存在
   */
  error?: string;
  
  /**
   * 元数据
   */
  metadata?: {
    /**
     * 请求ID
     */
    requestId?: string;
    
    /**
     * 执行时间（毫秒）
     */
    executionTime?: number;
    
    /**
     * 服务器名称
     */
    server?: string;
    
    /**
     * 工具名称
     */
    tool?: string;
    
    /**
     * 缓存信息
     */
    cache?: {
      /**
       * 是否命中缓存
       */
      hit: boolean;
      
      /**
       * 缓存时间
       */
      time?: number;
    };
  };
}

/**
 * 工具代理接口
 * 提供对服务器工具的动态访问
 */
export interface ToolProxy {
  [toolName: string]: (params: any) => Promise<ToolCallResult>;
}

/**
 * 服务元数据
 */
export interface ServiceMetadata {
  /**
   * 服务ID
   */
  id: string;
  
  /**
   * 服务名称
   */
  name: string;
  
  /**
   * 服务版本
   */
  version: string;
  
  /**
   * 服务描述
   */
  description?: string;
  
  /**
   * 服务工具定义
   */
  tools: any[];
  
  /**
   * 服务端点
   */
  endpoint: string;
} 