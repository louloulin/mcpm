/**
 * HTTP/SSE传输实现
 */
import { EventEmitter } from 'events';
import { MCPMessage, MCPTransportType } from '../types';
import { BaseTransportConnection, DEFAULT_TRANSPORT_CONFIG } from './base';
import { 
  TransportConnection, 
  TransportConfig, 
  TransportConnectionState,
  TransportProvider
} from './types';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

/**
 * HTTP/SSE传输特有配置
 */
export interface HttpSseTransportOptions {
  // 服务器URL
  serverUrl?: string;
  // 客户端URL
  clientUrl?: string;
  // 心跳间隔(毫秒)
  heartbeatInterval?: number;
  // 认证令牌
  authToken?: string;
  // 请求头
  headers?: Record<string, string>;
}

/**
 * HTTP/SSE连接实现
 */
export class HttpSseConnection extends BaseTransportConnection {
  private eventSource: EventSource | null = null;
  private eventEmitter = new EventEmitter();
  private serverUrl: string | null = null;
  private clientResponse: Response | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  
  constructor(config?: TransportConfig) {
    super(MCPTransportType.HTTP_SSE, config);
    const options = this.config.transportOptions as HttpSseTransportOptions;
    this.serverUrl = options?.serverUrl || null;
  }

  /**
   * 作为客户端连接到服务器
   * @param serverUrl 服务器URL
   */
  async connectToServer(serverUrl: string): Promise<void> {
    if (this.state === TransportConnectionState.CONNECTED) {
      return;
    }
    
    this.serverUrl = serverUrl;
    this.updateState(TransportConnectionState.CONNECTING);
    
    try {
      // 使用EventSource连接服务器
      const options = this.config.transportOptions as HttpSseTransportOptions;
      const headers: Record<string, string> = {
        ...(options?.headers || {}),
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      };
      
      if (options?.authToken) {
        headers['Authorization'] = `Bearer ${options.authToken}`;
      }

      // 在Node.js环境中使用EventSource polyfill
      if (typeof window === 'undefined') {
        const EventSource = require('eventsource');
        this.eventSource = new EventSource(serverUrl, { headers });
      } else {
        this.eventSource = new EventSource(serverUrl);
      }

      this.eventSource.onopen = () => {
        this.updateState(TransportConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as MCPMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('解析SSE消息失败:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        this.handleConnectionError(error);
      };
    } catch (error) {
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  /**
   * 作为服务器处理客户端请求
   * @param req Express请求
   * @param res Express响应
   */
  handleClientRequest(req: Request, res: Response): void {
    if (this.state === TransportConnectionState.CONNECTED) {
      this.close();
    }

    // 设置SSE头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
    res.flushHeaders();

    // 发送连接建立事件
    res.write(`data: ${JSON.stringify({ type: 'connection_established', connectionId: this.id })}\n\n`);
    
    // 保存响应对象
    this.clientResponse = res;
    this.updateState(TransportConnectionState.CONNECTED);
    this.startHeartbeat();

    // 处理客户端断开连接
    req.on('close', () => {
      this.updateState(TransportConnectionState.DISCONNECTED);
      this.stopHeartbeat();
      this.clientResponse = null;
    });
  }

  /**
   * 发送消息
   * @param message 要发送的消息
   */
  async send(message: MCPMessage): Promise<void> {
    if (this.state !== TransportConnectionState.CONNECTED) {
      throw new Error('连接未建立或已关闭');
    }

    const messageJson = JSON.stringify(message);

    // 作为客户端向服务器发送消息
    if (this.serverUrl && !this.clientResponse) {
      const options = this.config.transportOptions as HttpSseTransportOptions;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      };
      
      if (options?.authToken) {
        headers['Authorization'] = `Bearer ${options.authToken}`;
      }

      try {
        const response = await fetch(this.serverUrl, {
          method: 'POST',
          headers,
          body: messageJson,
        });

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
      } catch (error) {
        this.updateState(TransportConnectionState.ERROR, error as Error);
        throw error;
      }
    } 
    // 作为服务器向客户端发送消息
    else if (this.clientResponse) {
      try {
        this.clientResponse.write(`data: ${messageJson}\n\n`);
      } catch (error) {
        this.updateState(TransportConnectionState.ERROR, error as Error);
        throw error;
      }
    } else {
      throw new Error('无效的连接状态');
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    this.stopHeartbeat();

    // 关闭EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // 关闭客户端连接
    if (this.clientResponse) {
      try {
        this.clientResponse.end();
      } catch (error) {
        console.error('关闭客户端连接出错:', error);
      }
      this.clientResponse = null;
    }

    this.updateState(TransportConnectionState.DISCONNECTED);
  }

  /**
   * 处理连接错误
   * @param error 错误对象
   */
  private handleConnectionError(error: Error | Event): void {
    this.updateState(TransportConnectionState.ERROR, error instanceof Error ? error : new Error('连接错误'));
    this.stopHeartbeat();

    // 尝试重连
    const retry = this.config.retry;
    if (retry && this.reconnectAttempts < (retry.maxRetries || 3) && this.serverUrl) {
      this.reconnectAttempts++;
      const delay = retry.interval ? retry.interval * Math.pow(retry.factor || 1, this.reconnectAttempts - 1) : 1000;
      
      setTimeout(() => {
        if (this.serverUrl) {
          this.connectToServer(this.serverUrl).catch(console.error);
        }
      }, delay);
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    const options = this.config.transportOptions as HttpSseTransportOptions;
    const interval = options?.heartbeatInterval || 30000; // 默认30秒
    
    this.heartbeatInterval = setInterval(() => {
      if (this.state === TransportConnectionState.CONNECTED) {
        // 发送心跳消息
        const heartbeatMessage: MCPMessage = {
          id: uuidv4(),
          type: 'heartbeat',
          timestamp: Date.now(),
        };
        
        this.send(heartbeatMessage).catch(error => {
          console.error('发送心跳消息失败:', error);
        });
      } else {
        this.stopHeartbeat();
      }
    }, interval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

/**
 * HTTP/SSE传输提供者
 */
export class HttpSseTransportProvider implements TransportProvider {
  readonly type = MCPTransportType.HTTP_SSE;
  private serverConnections: Map<string, HttpSseConnection> = new Map();
  private expressApp: any;

  constructor(expressApp?: any) {
    this.expressApp = expressApp;
  }

  /**
   * 创建客户端连接
   * @param config 连接配置
   */
  async createConnection(config?: TransportConfig): Promise<TransportConnection> {
    const connection = new HttpSseConnection(config);
    
    // 如果提供了服务器URL，立即连接
    const options = config?.transportOptions as HttpSseTransportOptions;
    if (options?.serverUrl) {
      await connection.connectToServer(options.serverUrl);
    }
    
    return connection;
  }

  /**
   * 监听传入连接
   * @param config 监听配置
   * @param connectionHandler 连接处理器
   */
  async listen(
    config: TransportConfig, 
    connectionHandler: (connection: TransportConnection) => void
  ): Promise<void> {
    if (!this.expressApp) {
      throw new Error('HTTP/SSE监听需要提供Express应用实例');
    }

    const options = config.transportOptions as HttpSseTransportOptions;
    const path = options?.clientUrl || '/mcp/events';

    // 设置SSE端点
    this.expressApp.get(path, (req: Request, res: Response) => {
      const connection = new HttpSseConnection(config);
      connection.handleClientRequest(req, res);
      
      this.serverConnections.set(connection.id, connection);
      connectionHandler(connection);
      
      // 客户端断开时清理连接
      req.on('close', () => {
        this.serverConnections.delete(connection.id);
      });
    });

    // 设置消息接收端点
    this.expressApp.post(path, async (req: Request, res: Response) => {
      // 查找连接ID
      const connectionId = req.headers['x-connection-id'] as string;
      const connection = connectionId ? this.serverConnections.get(connectionId) : null;
      
      if (connection) {
        try {
          const message = req.body as MCPMessage;
          await connection.handleMessage(message);
          res.status(200).json({ success: true });
        } catch (error) {
          res.status(400).json({ error: 'Invalid message format' });
        }
      } else {
        res.status(404).json({ error: 'Connection not found' });
      }
    });
  }

  /**
   * 关闭传输提供者
   */
  async close(): Promise<void> {
    const closePromises = Array.from(this.serverConnections.values()).map(conn => conn.close());
    await Promise.all(closePromises);
    this.serverConnections.clear();
  }
} 