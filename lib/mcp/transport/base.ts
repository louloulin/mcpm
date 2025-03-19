/**
 * 提供传输连接的基础抽象类实现
 */
import { v4 as uuidv4 } from 'uuid';
import { MCPMessage, MCPTransportType } from '../types';
import { 
  TransportConnection, 
  TransportConnectionState, 
  TransportConfig,
  MessageHandler
} from './types';

/**
 * 默认传输配置
 */
export const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  timeout: 30000, // 30秒
  retry: {
    maxRetries: 3,
    interval: 1000,
    factor: 2
  }
};

/**
 * 基础连接抽象类
 * 提供共享的连接实现逻辑
 */
export abstract class BaseTransportConnection implements TransportConnection {
  readonly id: string;
  readonly type: MCPTransportType;
  readonly config: TransportConfig;
  
  protected _state: TransportConnectionState = TransportConnectionState.CONNECTING;
  protected messageHandlers: Set<MessageHandler> = new Set();
  protected lastError?: Error;

  constructor(type: MCPTransportType, config?: TransportConfig) {
    this.id = uuidv4();
    this.type = type;
    this.config = { ...DEFAULT_TRANSPORT_CONFIG, ...config };
  }

  /**
   * 获取当前连接状态
   */
  get state(): TransportConnectionState {
    return this._state;
  }

  /**
   * 获取最后一个错误
   */
  get error(): Error | undefined {
    return this.lastError;
  }

  /**
   * 添加消息处理器
   * @param handler 要添加的处理器
   */
  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * 移除消息处理器
   * @param handler 要移除的处理器
   */
  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * 处理收到的消息
   * @param message 收到的消息
   */
  protected async handleMessage(message: MCPMessage): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        await Promise.resolve(handler(message));
      } catch (error) {
        console.error(`处理消息时出错:`, error);
      }
    }
  }

  /**
   * 更新连接状态
   * @param state 新状态
   * @param error 错误(如果有)
   */
  protected updateState(state: TransportConnectionState, error?: Error): void {
    this._state = state;
    if (error) {
      this.lastError = error;
    }
  }

  /**
   * 发送消息(子类必须实现)
   * @param message 要发送的消息
   */
  abstract send(message: MCPMessage): Promise<void>;

  /**
   * 关闭连接(子类必须实现)
   */
  abstract close(): Promise<void>;
} 