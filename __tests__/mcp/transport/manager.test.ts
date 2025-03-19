/**
 * 传输管理器测试
 */
import { MCPTransportManager } from '../../../lib/mcp/transport/manager';
import { TransportConnection, TransportProvider } from '../../../lib/mcp/transport/types';
import { MCPTransportType } from '../../../lib/mcp/types';

// 模拟传输连接
class MockTransportConnection implements TransportConnection {
  readonly id: string;
  readonly type: MCPTransportType;
  readonly state: any;
  readonly config: any;

  constructor(id: string, type: MCPTransportType) {
    this.id = id;
    this.type = type;
  }

  async send(): Promise<void> {}
  async close(): Promise<void> {}
  addMessageHandler(): void {}
  removeMessageHandler(): void {}
}

// 模拟传输提供者
class MockTransportProvider implements TransportProvider {
  readonly type: MCPTransportType;
  private connections: MockTransportConnection[] = [];
  lastConfig?: any;
  closeWasCalled = false;

  constructor(type: MCPTransportType) {
    this.type = type;
  }

  async createConnection(config?: any): Promise<TransportConnection> {
    this.lastConfig = config;
    const connection = new MockTransportConnection(`conn-${this.connections.length}`, this.type);
    this.connections.push(connection);
    return connection;
  }

  async listen(config: any, connectionHandler: (connection: TransportConnection) => void): Promise<void> {
    this.lastConfig = config;
    // 创建一个连接并调用处理器
    const connection = new MockTransportConnection(`listen-${this.connections.length}`, this.type);
    this.connections.push(connection);
    connectionHandler(connection);
  }

  async close(): Promise<void> {
    this.closeWasCalled = true;
  }
}

describe('MCPTransportManager', () => {
  let manager: MCPTransportManager;
  let stdioProvider: MockTransportProvider;
  let httpSseProvider: MockTransportProvider;

  beforeEach(() => {
    manager = new MCPTransportManager();
    stdioProvider = new MockTransportProvider(MCPTransportType.STDIO);
    httpSseProvider = new MockTransportProvider(MCPTransportType.HTTP_SSE);
    
    // 注册提供者
    manager.registerProvider(stdioProvider);
    manager.registerProvider(httpSseProvider);
  });

  test('应该能够注册和获取传输提供者', () => {
    expect(manager.getProvider(MCPTransportType.STDIO)).toBe(stdioProvider);
    expect(manager.getProvider(MCPTransportType.HTTP_SSE)).toBe(httpSseProvider);
    expect(manager.getProvider('invalid' as MCPTransportType)).toBeUndefined();
  });

  test('应该能够创建连接', async () => {
    const config = { timeout: 1000 };
    const connection = await manager.createConnection(MCPTransportType.STDIO, config);
    
    expect(connection).toBeDefined();
    expect(stdioProvider.lastConfig).toBe(config);
  });

  test('创建不存在的传输类型的连接时应该抛出错误', async () => {
    await expect(
      manager.createConnection('invalid' as MCPTransportType)
    ).rejects.toThrow(/传输类型.*的提供者未注册/);
  });

  test('应该能够监听传入连接', async () => {
    const config = { timeout: 1000 };
    let receivedConnection: TransportConnection | null = null;
    
    await manager.listen(MCPTransportType.STDIO, config, (connection) => {
      receivedConnection = connection;
    });
    
    expect(receivedConnection).toBeDefined();
    expect(stdioProvider.lastConfig).toBe(config);
  });

  test('监听不存在的传输类型时应该抛出错误', async () => {
    await expect(
      manager.listen('invalid' as MCPTransportType, {}, () => {})
    ).rejects.toThrow(/传输类型.*的提供者未注册/);
  });

  test('应该能够关闭所有连接和提供者', async () => {
    // 创建一些连接
    await manager.createConnection(MCPTransportType.STDIO);
    await manager.createConnection(MCPTransportType.HTTP_SSE);
    
    // 关闭所有
    await manager.closeAll();
    
    expect(stdioProvider.closeWasCalled).toBe(true);
    expect(httpSseProvider.closeWasCalled).toBe(true);
  });

  test('应该能够获取所有连接', async () => {
    // 创建一些连接
    await manager.createConnection(MCPTransportType.STDIO);
    await manager.createConnection(MCPTransportType.HTTP_SSE);
    
    const connections = manager.getAllConnections();
    expect(connections.length).toBe(2);
  });

  test('应该能够按类型获取连接', async () => {
    // 创建一些连接
    await manager.createConnection(MCPTransportType.STDIO);
    await manager.createConnection(MCPTransportType.STDIO);
    await manager.createConnection(MCPTransportType.HTTP_SSE);
    
    const stdioConnections = manager.getConnectionsByType(MCPTransportType.STDIO);
    const httpSseConnections = manager.getConnectionsByType(MCPTransportType.HTTP_SSE);
    
    expect(stdioConnections.length).toBe(2);
    expect(httpSseConnections.length).toBe(1);
  });
}); 