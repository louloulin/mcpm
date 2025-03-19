/**
 * MCP传输管理器实现
 */
import { MCPTransportType } from '../types';
import { TransportConfig, TransportConnection, TransportManager, TransportProvider } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCP传输管理器实现
 * 负责管理所有传输提供者和连接
 */
export class MCPTransportManager implements TransportManager {
  private providers: Map<MCPTransportType, TransportProvider> = new Map();
  private connections: Map<string, TransportConnection> = new Map();

  /**
   * 注册传输提供者
   * @param provider 传输提供者
   */
  registerProvider(provider: TransportProvider): void {
    this.providers.set(provider.type, provider);
  }

  /**
   * 获取传输提供者
   * @param type 传输类型
   */
  getProvider(type: MCPTransportType): TransportProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * 创建连接
   * @param type 传输类型
   * @param config 连接配置
   */
  async createConnection(type: MCPTransportType, config?: TransportConfig): Promise<TransportConnection> {
    const provider = this.getProvider(type);
    if (!provider) {
      throw new Error(`传输类型 ${type} 的提供者未注册`);
    }

    const connection = await provider.createConnection(config);
    this.connections.set(connection.id, connection);
    
    return connection;
  }

  /**
   * 监听传入连接
   * @param type 传输类型 
   * @param config 监听配置
   * @param connectionHandler 连接处理器
   */
  async listen(
    type: MCPTransportType,
    config: TransportConfig,
    connectionHandler: (connection: TransportConnection) => void
  ): Promise<void> {
    const provider = this.getProvider(type);
    if (!provider) {
      throw new Error(`传输类型 ${type} 的提供者未注册`);
    }

    await provider.listen(config, (connection: TransportConnection) => {
      this.connections.set(connection.id, connection);
      connectionHandler(connection);
    });
  }

  /**
   * 关闭连接
   * @param connectionId 连接ID
   */
  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await connection.close();
      this.connections.delete(connectionId);
    }
  }

  /**
   * 关闭所有连接和提供者
   */
  async closeAll(): Promise<void> {
    // 关闭所有连接
    const connectionPromises = Array.from(this.connections.values()).map(connection => connection.close());
    await Promise.all(connectionPromises);
    this.connections.clear();

    // 关闭所有提供者
    const providerPromises = Array.from(this.providers.values()).map(provider => provider.close());
    await Promise.all(providerPromises);
  }

  /**
   * 获取所有活动连接
   */
  getAllConnections(): TransportConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 按类型获取连接
   * @param type 传输类型
   */
  getConnectionsByType(type: MCPTransportType): TransportConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.type === type);
  }
}

/**
 * 创建并导出单例传输管理器
 */
export const transportManager = new MCPTransportManager();

export default transportManager;