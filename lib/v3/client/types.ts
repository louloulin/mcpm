/**
 * MCPM 3.0 客户端类型定义
 */

import { MCPTool } from '../../mcp/types';

/**
 * MCP客户端配置选项
 */
export interface MCPClientOptions {
  /**
   * MCP注册表URL
   * @default "https://registry.mcpm.io"
   */
  registry?: string;
  
  /**
   * 身份验证凭据（API密钥）
   */
  credentials?: string;
  
  /**
   * 是否启用服务自动发现
   * @default false
   */
  autoDiscovery?: boolean;
  
  /**
   * 缓存策略
   * @default "memory"
   */
  cacheStrategy?: 'memory' | 'persistent' | 'none';
  
  /**
   * 请求超时（毫秒）
   * @default 30000
   */
  timeout?: number;
  
  /**
   * 是否启用调试模式
   * @default false
   */
  debug?: boolean;
}

/**
 * 工具代理接口
 * 提供对服务器工具的动态访问
 */
export interface ToolProxy {
  [serviceName: string]: {
    [toolName: string]: (params: any) => Promise<any>;
  };
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
  tools: MCPTool[];
  
  /**
   * 服务端点
   */
  endpoint: string;
}

/**
 * 工具调用结果
 */
export interface ToolCallResult<T = any> {
  /**
   * 调用是否成功
   */
  success: boolean;
  
  /**
   * 工具调用返回的数据
   */
  data?: T;
  
  /**
   * 错误信息（如果有）
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
     * 服务ID
     */
    serviceId?: string;
  };
} 