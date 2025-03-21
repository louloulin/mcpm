import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifySessionToken } from '../../api/auth';
import { 
  NotificationService, 
  NotificationData,
} from './NotificationService';

interface WebSocketClient extends WebSocket {
  userId: string;
  isAlive: boolean;
  lastActivity: Date;
}

/**
 * WebSocket通知服务
 * 
 * 负责通过WebSocket推送实时通知给用户
 */
export class NotificationWebSocketService {
  private static instance: NotificationWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocketClient>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private notificationService: NotificationService;
  private subscribedToService: boolean = false;
  
  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): NotificationWebSocketService {
    if (!NotificationWebSocketService.instance) {
      NotificationWebSocketService.instance = new NotificationWebSocketService();
    }
    return NotificationWebSocketService.instance;
  }
  
  /**
   * 初始化WebSocket服务器
   * @param server HTTP服务器实例
   * @param path WebSocket路径
   */
  public initialize(server: Server, path: string = '/api/notifications/ws'): void {
    if (this.wss) {
      console.warn('WebSocket服务已经初始化');
      return;
    }
    
    // 创建WebSocket服务器
    this.wss = new WebSocketServer({ 
      noServer: true,
    });
    
    // 处理新的WebSocket连接
    server.on('upgrade', async (request: IncomingMessage, socket, head) => {
      const { pathname, query } = parse(request.url || '', true);
      
      // 只处理指定路径的WebSocket连接
      if (pathname !== path) {
        return;
      }
      
      try {
        // 从查询参数获取token
        const token = query.token as string;
        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // 验证token
        const session = await verifySessionToken(token);
        if (!session) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        const userId = session.userId;
        
        // 升级连接到WebSocket
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          const wsClient = ws as WebSocketClient;
          wsClient.userId = userId;
          wsClient.isAlive = true;
          wsClient.lastActivity = new Date();
          
          this.wss!.emit('connection', wsClient, request);
        });
      } catch (error) {
        console.error('WebSocket连接升级失败:', error);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    });
    
    // 处理连接事件
    this.wss.on('connection', (ws: WebSocketClient) => {
      const userId = ws.userId;
      console.log(`用户 ${userId} 已连接通知WebSocket`);
      
      // 将连接添加到客户端映射
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);
      
      // 订阅该用户的通知
      this.ensureSubscribedToNotifications();
      
      // ping-pong检测保持连接活跃
      ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastActivity = new Date();
      });
      
      // 处理消息
      ws.on('message', (message: Buffer | string) => {
        try {
          const data = JSON.parse(message.toString());
          ws.lastActivity = new Date();
          
          // 处理客户端消息
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          } else if (data.type === 'markAsRead' && data.id) {
            this.notificationService.markAsRead(data.id, userId)
              .then((success) => {
                if (success) {
                  ws.send(JSON.stringify({ 
                    type: 'readConfirmation', 
                    id: data.id, 
                    success: true 
                  }));
                }
              })
              .catch(err => {
                console.error(`标记通知已读失败: ${err.message}`);
                ws.send(JSON.stringify({ 
                  type: 'readConfirmation', 
                  id: data.id, 
                  success: false,
                  error: '操作失败'
                }));
              });
          }
        } catch (error) {
          console.error('处理WebSocket消息时出错:', error);
        }
      });
      
      // 处理关闭事件
      ws.on('close', () => {
        console.log(`用户 ${userId} 断开通知WebSocket连接`);
        this.removeClient(userId, ws);
      });
      
      // 处理错误
      ws.on('error', (err) => {
        console.error(`用户 ${userId} WebSocket错误:`, err);
        this.removeClient(userId, ws);
      });
      
      // 发送欢迎消息
      ws.send(JSON.stringify({ 
        type: 'connected', 
        userId, 
        timestamp: new Date().toISOString() 
      }));
      
      // 发送未读通知数量
      this.sendUnreadCount(userId, ws);
    });
    
    // 启动心跳检测
    this.startHeartbeat();
  }
  
  /**
   * 确保服务已订阅通知服务
   */
  private ensureSubscribedToNotifications(): void {
    if (this.subscribedToService) {
      return;
    }
    
    // 订阅所有用户的通知
    this.notificationService.subscribeToUserNotifications('*', (notification) => {
      this.handleNewNotification(notification);
    });
    
    this.subscribedToService = true;
  }
  
  /**
   * 处理新的通知
   * @param notification 通知数据
   */
  private handleNewNotification(notification: NotificationData): void {
    const { userId } = notification;
    
    // 获取用户的WebSocket连接
    const userConnections = this.clients.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return;
    }
    
    // 构建通知消息
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
    
    // 发送到用户的所有连接
    userConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  /**
   * 发送未读通知计数
   * @param userId 用户ID
   * @param client 特定客户端(可选)
   */
  private async sendUnreadCount(userId: string, client?: WebSocketClient): Promise<void> {
    try {
      // 获取未读通知数量
      const unreadNotifications = await this.notificationService.getUserNotifications(userId, {
        unreadOnly: true,
        limit: 100
      });
      
      const count = unreadNotifications.length;
      const message = JSON.stringify({
        type: 'unreadCount',
        count,
        timestamp: new Date().toISOString()
      });
      
      // 如果指定了客户端，只发送给该客户端
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
        return;
      }
      
      // 否则发送给用户的所有连接
      const userConnections = this.clients.get(userId);
      if (userConnections) {
        userConnections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    } catch (error) {
      console.error(`发送未读通知计数失败:`, error);
    }
  }
  
  /**
   * 移除客户端连接
   * @param userId 用户ID
   * @param client 客户端
   */
  private removeClient(userId: string, client: WebSocketClient): void {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.delete(client);
      
      // 如果用户没有更多的连接，则从Map中移除
      if (userConnections.size === 0) {
        this.clients.delete(userId);
      }
    }
    
    try {
      client.terminate();
    } catch {
      // 忽略关闭错误
    }
  }
  
  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      this.clients.forEach((clients, userId) => {
        clients.forEach(client => {
          if (client.isAlive === false) {
            console.log(`用户 ${userId} 的连接不活跃，关闭中...`);
            this.removeClient(userId, client);
            return;
          }
          
          // 检查最后活动时间是否超过30分钟
          const now = new Date();
          const lastActivity = client.lastActivity || now;
          const inactiveMs = now.getTime() - lastActivity.getTime();
          
          // 如果30分钟内没有活动，关闭连接
          if (inactiveMs > 30 * 60 * 1000) {
            console.log(`用户 ${userId} 的连接超过30分钟没有活动，关闭中...`);
            this.removeClient(userId, client);
            return;
          }
          
          client.isAlive = false;
          client.ping();
        });
      });
    }, 30000); // 每30秒检查一次
  }
  
  /**
   * 向用户发送通知
   * @param userId 用户ID
   * @param notification 通知数据
   */
  public sendNotificationToUser(userId: string, notification: NotificationData): void {
    const userConnections = this.clients.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return;
    }
    
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
    
    userConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  /**
   * 关闭WebSocket服务
   */
  public close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // 关闭所有连接
    this.clients.forEach((clients) => {
      clients.forEach(client => {
        try {
          client.close();
        } catch {
          // 忽略关闭错误
        }
      });
    });
    
    this.clients.clear();
    
    // 关闭WebSocket服务器
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.subscribedToService = false;
  }
  
  /**
   * 获取活跃连接统计
   */
  public getStats(): { 
    activeUsers: number; 
    totalConnections: number;
    userConnections: Record<string, number>;
  } {
    const stats = {
      activeUsers: this.clients.size,
      totalConnections: 0,
      userConnections: {} as Record<string, number>
    };
    
    this.clients.forEach((clients, userId) => {
      const activeConnections = Array.from(clients).filter(
        client => client.readyState === WebSocket.OPEN
      ).length;
      
      stats.totalConnections += activeConnections;
      stats.userConnections[userId] = activeConnections;
    });
    
    return stats;
  }
}

// 导出单例实例
export const notificationWebSocketService = NotificationWebSocketService.getInstance(); 