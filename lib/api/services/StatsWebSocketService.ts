import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifyToken } from '../../auth';
import { statsRepository } from '../../database/repositories/statsRepository';

// 定义WebSocket连接状态常量
const OPEN = 1; // WebSocket.OPEN

/**
 * WebSocket客户端扩展类型 - 添加用户ID
 */
interface WebSocketClient extends WebSocket {
  userId: string;
  subscriptions: Set<string>; // 用户订阅的统计数据类型
  isAlive: boolean;
}

/**
 * 实时统计WebSocket服务
 * 
 * 负责通过WebSocket推送实时统计数据给用户
 */
export class StatsWebSocketService {
  private static instance: StatsWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocketClient>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private statsUpdateInterval: NodeJS.Timeout | null = null;
  private path: string = '/api/stats/ws';
  
  // 私有构造函数，使用单例模式
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  public static getInstance(): StatsWebSocketService {
    if (!StatsWebSocketService.instance) {
      StatsWebSocketService.instance = new StatsWebSocketService();
    }
    return StatsWebSocketService.instance;
  }
  
  /**
   * 初始化WebSocket服务器
   * @param server HTTP服务器实例
   * @param wsPath WebSocket路径
   */
  public initialize(server: HttpServer, wsPath?: string): void {
    if (this.wss) {
      console.warn('实时统计WebSocket服务已经初始化');
      return;
    }
    
    if (wsPath) {
      this.path = wsPath;
    }
    
    // 创建WebSocket服务器
    this.wss = new WebSocketServer({
      noServer: true
    });
    
    // 处理新的WebSocket连接
    server.on('upgrade', async (request: IncomingMessage, socket, head) => {
      try {
        const pathname = parse(request.url || '', true).pathname;
        
        // 只处理指定路径的WebSocket连接
        if (pathname !== this.path) {
          return;
        }
        
        // 验证用户令牌
        const token = parse(request.url || '', true).query.token as string;
        if (!token) {
          console.warn('没有提供认证令牌');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        const userData = await verifyToken(token);
        if (!userData || !userData.id) {
          console.warn('无效的认证令牌');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        const userId = userData.id;
        
        // 升级连接到WebSocket
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          const wsClient = ws as WebSocketClient;
          wsClient.userId = userId;
          wsClient.subscriptions = new Set();
          wsClient.isAlive = true;
          
          // 添加到客户端集合
          this.addClient(userId, wsClient);
          
          // 触发连接事件
          this.wss!.emit('connection', wsClient, request);
        });
      } catch (error) {
        console.error('统计WebSocket连接升级失败:', error);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    });
    
    // 处理WebSocket连接
    this.wss.on('connection', (ws: WebSocketClient) => {
      const userId = ws.userId;
      console.log(`用户 ${userId} 已连接实时统计WebSocket`);
      
      // 初始发送系统统计数据
      this.sendSystemStats(userId, ws);
      
      // 处理消息
      ws.on('message', async (messageData: Buffer | ArrayBuffer | Buffer[]) => {
        try {
          const messageStr = messageData.toString();
          const message = JSON.parse(messageStr);
          
          switch (message.type) {
            case 'subscribe':
              // 订阅特定统计数据
              if (message.statsType && typeof message.statsType === 'string') {
                ws.subscriptions.add(message.statsType);
                await this.handleSubscription(userId, ws, message.statsType);
              }
              break;
              
            case 'unsubscribe':
              // 取消订阅特定统计数据
              if (message.statsType && typeof message.statsType === 'string') {
                ws.subscriptions.delete(message.statsType);
              }
              break;
              
            case 'ping':
              // 心跳检测响应
              ws.isAlive = true;
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
              
            default:
              console.warn(`未知的消息类型: ${message.type}`);
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error);
        }
      });
      
      // 处理连接关闭
      ws.on('close', () => {
        console.log(`用户 ${userId} 断开实时统计WebSocket连接`);
        this.removeClient(userId, ws);
      });
      
      // 处理错误
      ws.on('error', (err) => {
        console.error(`用户 ${userId} 统计WebSocket错误:`, err);
        this.removeClient(userId, ws);
      });
      
      // 设置心跳检测
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
    
    // 启动定期心跳检测
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000); // 每30秒检测一次
    
    // 启动定期统计数据更新
    this.statsUpdateInterval = setInterval(() => {
      this.broadcastSystemStats();
    }, 10000); // 每10秒更新一次
  }
  
  /**
   * 处理订阅请求
   */
  private async handleSubscription(userId: string, client: WebSocketClient, statsType: string): Promise<void> {
    switch (statsType) {
      case 'system':
        await this.sendSystemStats(userId, client);
        break;
        
      case 'developer':
        await this.sendDeveloperStats(userId, client);
        break;
        
      case 'server':
        if (client.readyState === OPEN) {
          // 请求特定服务器ID
          client.send(JSON.stringify({
            type: 'request',
            dataType: 'serverId',
            message: '请提供要监控的服务器ID'
          }));
        }
        break;
        
      default:
        if (client.readyState === OPEN) {
          client.send(JSON.stringify({
            type: 'error',
            message: `不支持的统计数据类型: ${statsType}`
          }));
        }
    }
  }
  
  /**
   * 发送系统统计数据
   */
  private async sendSystemStats(userId: string, client?: WebSocketClient): Promise<void> {
    try {
      const stats = await statsRepository.getOverview();
      const popularServers = await statsRepository.getPopularServers(5);
      
      const message = {
        type: 'stats',
        statsType: 'system',
        timestamp: Date.now(),
        data: {
          ...stats,
          popularServers
        }
      };
      
      if (client && client.readyState === OPEN) {
        client.send(JSON.stringify(message));
      } else {
        this.sendToUser(userId, message);
      }
    } catch (error) {
      console.error('发送系统统计数据失败:', error);
    }
  }
  
  /**
   * 发送开发者统计数据
   */
  private async sendDeveloperStats(userId: string, client?: WebSocketClient): Promise<void> {
    try {
      const stats = await statsRepository.getDeveloperStats(userId);
      
      const message = {
        type: 'stats',
        statsType: 'developer',
        timestamp: Date.now(),
        data: stats
      };
      
      if (client && client.readyState === OPEN) {
        client.send(JSON.stringify(message));
      } else {
        this.sendToUser(userId, message);
      }
    } catch (error) {
      console.error('发送开发者统计数据失败:', error);
    }
  }
  
  /**
   * 广播系统统计数据给所有订阅用户
   */
  private async broadcastSystemStats(): Promise<void> {
    try {
      const stats = await statsRepository.getOverview();
      const popularServers = await statsRepository.getPopularServers(5);
      
      const message = {
        type: 'stats',
        statsType: 'system',
        timestamp: Date.now(),
        data: {
          ...stats,
          popularServers
        }
      };
      
      // 遍历所有客户端，查找订阅了系统统计的客户端
      for (const [, clients] of this.clients.entries()) {
        for (const client of clients) {
          if (client.subscriptions.has('system') && client.readyState === OPEN) {
            client.send(JSON.stringify(message));
          }
        }
      }
    } catch (error) {
      console.error('广播系统统计数据失败:', error);
    }
  }
  
  /**
   * 向指定用户发送消息
   */
  private sendToUser(userId: string, message: any): void {
    const clients = this.clients.get(userId);
    if (!clients || clients.size === 0) {
      return;
    }
    
    const messageStr = JSON.stringify(message);
    for (const ws of clients) {
      if (ws.readyState === OPEN) {
        ws.send(messageStr);
      }
    }
  }
  
  /**
   * 添加客户端
   */
  private addClient(userId: string, client: WebSocketClient): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    
    this.clients.get(userId)!.add(client);
  }
  
  /**
   * 移除客户端
   */
  private removeClient(userId: string, client: WebSocketClient): void {
    const clients = this.clients.get(userId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }
  
  /**
   * 发送心跳检测并清理断开的连接
   */
  private pingClients(): void {
    for (const [userId, clients] of this.clients.entries()) {
      const activeClients = new Set<WebSocketClient>();
      
      for (const client of clients) {
        if (!client.isAlive) {
          // 客户端没有响应上一次的心跳检测，认为已断开
          client.terminate();
        } else {
          // 重置状态并发送新的ping
          client.isAlive = false;
          client.ping();
          activeClients.add(client);
        }
      }
      
      // 更新活跃客户端集合
      if (activeClients.size === 0) {
        this.clients.delete(userId);
      } else if (activeClients.size !== clients.size) {
        this.clients.set(userId, activeClients);
      }
    }
  }
  
  /**
   * 获取当前连接的客户端数量
   */
  public getActiveConnections(): number {
    let count = 0;
    for (const clients of this.clients.values()) {
      count += Array.from(clients).filter(
        client => client.readyState === OPEN
      ).length;
    }
    return count;
  }
  
  /**
   * 关闭WebSocket服务
   */
  public close(): void {
    // 清除定时器
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
    
    // 关闭所有连接
    for (const clients of this.clients.values()) {
      for (const client of clients) {
        client.terminate();
      }
    }
    
    this.clients.clear();
    
    // 关闭WebSocket服务器
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

// 导出单例实例
export const statsWebSocketService = StatsWebSocketService.getInstance(); 