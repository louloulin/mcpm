/**
 * MCPM 3.0 框架适配器类型定义
 * 
 * 本文件定义了框架适配器的接口和类型，用于将MCPM集成到不同的AI框架中
 */

import { MCPClient } from '../client';

/**
 * 基础适配器接口
 * 所有框架适配器都应实现这个接口
 */
export interface BaseAdapter {
  /**
   * 适配器名称
   */
  name: string;
  
  /**
   * 适配器版本
   */
  version: string;
  
  /**
   * 初始化适配器
   * @param options 初始化选项
   */
  init(options?: Record<string, any>): Promise<void>;
  
  /**
   * 关闭适配器释放资源
   */
  close(): Promise<void>;
}

/**
 * MCP工具包装选项
 */
export interface MCPToolWrapperOptions {
  /**
   * 工具名称
   */
  name?: string;
  
  /**
   * 工具描述
   */
  description?: string;
  
  /**
   * MCP客户端实例
   */
  client: MCPClient;
  
  /**
   * 要包装的工具名称
   */
  toolName: string;
  
  /**
   * 自定义参数映射函数
   */
  paramsMapper?: (params: Record<string, any>) => Record<string, any>;
  
  /**
   * 自定义结果映射函数
   */
  resultMapper?: (result: any) => any;
}

/**
 * 框架适配器配置选项
 */
export interface AdapterOptions {
  /**
   * MCP客户端实例或配置选项
   */
  client: MCPClient | Record<string, any>;
  
  /**
   * 是否自动发现并包装所有工具
   */
  autoDiscoverTools?: boolean;
  
  /**
   * 调试模式
   */
  debug?: boolean;
  
  /**
   * 工具前缀
   */
  toolPrefix?: string;
} 