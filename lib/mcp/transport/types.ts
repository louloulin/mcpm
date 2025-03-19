/**
 * MCP传输模块类型定义
 */
import { MCPMessage, MCPRequest, MCPResponse, MCPTransportType } from '../types';

/**
 * 传输连接状态
 */
export enum TransportConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected', 
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * 传输连接配置
 */
export interface TransportConfig {
  // 超时设置(毫秒)
  timeout?: number;
  // 重试设置
  retry?: {
    // 最大重试次数
    maxRetries?: number;
    // 重试间隔(毫秒)
    interval?: number;
    // 重试时间递增因子
    factor?: number;
  };
  // 传输特定配置
  transportOptions?: Record<string, any>;
}

/**
 * 消息处理器
 */
export type MessageHandler = (message: MCPMessage) => void | Promise<void>;

/**
 * 传输连接接口
 */
export interface TransportConnection {
  // 连接ID
  readonly id: string;
  // 连接状态
  readonly state: TransportConnectionState;
  // 连接类型
  readonly type: MCPTransportType;
  // 连接配置
  readonly config: TransportConfig;
  
  /**
   * 发送消息
   * @param message 要发送的消息
   */
  send(message: MCPMessage): Promise<void>;
  
  /**
   * 关闭连接
   */
  close(): Promise<void>;
  
  /**
   * 添加消息处理器
   * @param handler 消息处理器函数
   */
  addMessageHandler(handler: MessageHandler): void;
  
  /**
   * 移除消息处理器
   * @param handler 消息处理器函数
   */
  removeMessageHandler(handler: MessageHandler): void;
}

/**
 * 传输提供者接口
 */
export interface TransportProvider {
  // 传输类型
  readonly type: MCPTransportType;
  
  /**
   * 创建新连接
   * @param config 连接配置
   */
  createConnection(config?: TransportConfig): Promise<TransportConnection>;
  
  /**
   * 监听传入连接
   * @param config 监听配置
   * @param connectionHandler 连接处理器
   */
  listen(config: TransportConfig, connectionHandler: (connection: TransportConnection) => void): Promise<void>;
  
  /**
   * 关闭传输提供者
   */
  close(): Promise<void>;
}

/**
 * RPC请求处理器
 */
export type RequestHandler = (request: MCPRequest) => Promise<MCPResponse>;

/**
 * 传输管理器接口
 */
export interface TransportManager {
  /**
   * 注册传输提供者
   * @param provider 传输提供者
   */
  registerProvider(provider: TransportProvider): void;
  
  /**
   * 获取传输提供者
   * @param type 传输类型
   */
  getProvider(type: MCPTransportType): TransportProvider | undefined;
  
  /**
   * 创建连接
   * @param type 传输类型
   * @param config 连接配置
   */
  createConnection(type: MCPTransportType, config?: TransportConfig): Promise<TransportConnection>;
  
  /**
   * 监听传入连接
   * @param type 传输类型 
   * @param config 监听配置
   * @param connectionHandler 连接处理器
   */
  listen(type: MCPTransportType, config: TransportConfig, connectionHandler: (connection: TransportConnection) => void): Promise<void>;
  
  /**
   * 关闭所有连接和提供者
   */
  closeAll(): Promise<void>;
} 