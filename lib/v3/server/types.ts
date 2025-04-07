/**
 * MCPM 3.0 服务器类型定义
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { MCPTool, MCPServerDefinition, MCPServerSecurity } from '../../mcp/types';

/**
 * 工具处理函数类型
 */
export type ToolHandler<T = any, R = any> = (
  params: T,
  context: ToolContext
) => Promise<R> | R;

/**
 * 工具中间件类型
 */
export type ToolMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
  context: ToolContext
) => void | Promise<void>;

/**
 * 工具上下文
 */
export interface ToolContext {
  /**
   * 请求对象
   */
  req: Request;
  
  /**
   * 响应对象
   */
  res: Response;
  
  /**
   * 请求ID
   */
  requestId: string;
  
  /**
   * 身份验证信息
   */
  auth?: {
    /**
     * 用户ID（如果已验证）
     */
    userId?: string;
    
    /**
     * 令牌
     */
    token?: string;
    
    /**
     * API密钥
     */
    apiKey?: string;
  };
  
  /**
   * 元数据
   */
  metadata: Record<string, any>;
}

/**
 * 工具定义选项
 */
export interface ToolDefinitionOptions<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> {
  /**
   * 工具名称
   */
  name: string;
  
  /**
   * 工具描述
   */
  description: string;
  
  /**
   * 输入参数Schema (Zod)
   */
  input: TInput;
  
  /**
   * 输出参数Schema (Zod，可选)
   */
  output?: TOutput;
  
  /**
   * 处理函数
   */
  handler: ToolHandler<z.infer<TInput>, z.infer<TOutput>>;
  
  /**
   * 中间件函数列表
   */
  middlewares?: ToolMiddleware[];
}

/**
 * 服务器创建选项
 */
export interface ServerOptions {
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
   * 工具定义列表
   */
  tools: MCPTool[];
  
  /**
   * 安全设置
   */
  security?: MCPServerSecurity;
  
  /**
   * 服务器端口
   * @default 3000
   */
  port?: number;
  
  /**
   * 是否记录请求日志
   * @default true
   */
  logging?: boolean;
  
  /**
   * 服务器中间件
   */
  middleware?: {
    /**
     * 预处理中间件（在路由之前）
     */
    before?: any[];
    
    /**
     * 后处理中间件（在路由之后）
     */
    after?: any[];
  };
}

/**
 * 内部类型：带工具定义的完整工具对象
 */
export interface ToolWithDefinition {
  /**
   * 原始MCP工具定义
   */
  definition: MCPTool;
  
  /**
   * 处理函数
   */
  handler: ToolHandler;
  
  /**
   * 中间件函数列表
   */
  middlewares?: ToolMiddleware[];
  
  /**
   * 输入验证器
   */
  validateInput?: (data: any) => { success: boolean; error?: string; data?: any };
  
  /**
   * 输出验证器
   */
  validateOutput?: (data: any) => { success: boolean; error?: string; data?: any };
}

/**
 * 服务器实例接口
 */
export interface MCPServerInstance {
  /**
   * 服务器定义
   */
  definition: MCPServerDefinition;
  
  /**
   * 启动服务器
   * @param port 可选端口号
   */
  start(port?: number): Promise<void>;
  
  /**
   * 停止服务器
   */
  stop(): Promise<void>;
  
  /**
   * 获取服务器工具列表
   */
  getTools(): MCPTool[];
  
  /**
   * 添加工具
   * @param tool MCP工具定义
   * @param handler 处理函数
   * @param middlewares 可选中间件
   */
  addTool(tool: MCPTool, handler: ToolHandler, middlewares?: ToolMiddleware[]): void;
} 