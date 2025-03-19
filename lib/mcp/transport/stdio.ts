/**
 * STDIO传输实现
 */
import { ChildProcess, spawn } from 'child_process';
import { Readable, Writable } from 'stream';
import { MCPMessage, MCPTransportType } from '../types';
import { BaseTransportConnection } from './base';
import { 
  TransportConnection, 
  TransportConfig, 
  TransportConnectionState,
  TransportProvider
} from './types';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';

/**
 * STDIO传输特有配置
 */
export interface StdioTransportOptions {
  // 命令行和参数
  command?: string;
  args?: string[];
  // 环境变量
  env?: Record<string, string>;
  // 工作目录
  cwd?: string;
  // 心跳间隔(毫秒)
  heartbeatInterval?: number;
  // 是否重定向stderr到stdout
  redirectStderr?: boolean;
  // 输入流(默认为process.stdin)
  stdin?: Readable;
  // 输出流(默认为process.stdout)
  stdout?: Writable;
  // 错误流(默认为process.stderr)
  stderr?: Writable;
}

/**
 * STDIO连接实现
 */
export class StdioConnection extends BaseTransportConnection {
  private process: ChildProcess | null = null;
  private stdin: Readable | null = null;
  private stdout: Writable | null = null;
  private stderr: Writable | null = null;
  private inputLineReader: readline.Interface | null = null;
  private outputLineReader: readline.Interface | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageBuffer: string = '';
  private isChildProcess: boolean = false;

  constructor(config?: TransportConfig) {
    super(MCPTransportType.STDIO, config);
  }

  /**
   * 连接到子进程
   * @param command 命令
   * @param args 参数
   * @param options 选项
   */
  async connectToChildProcess(
    command: string, 
    args: string[] = [], 
    options: StdioTransportOptions = {}
  ): Promise<void> {
    if (this.state === TransportConnectionState.CONNECTED) {
      return;
    }

    this.updateState(TransportConnectionState.CONNECTING);
    this.isChildProcess = true;

    try {
      // 启动子进程
      this.process = spawn(command, args, {
        env: options.env,
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', options.redirectStderr ? 'pipe' : 'inherit']
      });

      // 连接标准流
      this.stdin = this.process.stdin!;
      this.stdout = this.process.stdout!;
      this.stderr = options.redirectStderr ? this.process.stderr! : null;

      // 设置输出行阅读器
      this.setupOutputReader();

      // 处理进程事件
      this.process.on('error', this.handleProcessError.bind(this));
      this.process.on('exit', this.handleProcessExit.bind(this));

      // 更新状态
      this.updateState(TransportConnectionState.CONNECTED);
      
      // 启动心跳
      this.startHeartbeat();
    } catch (error) {
      this.updateState(TransportConnectionState.ERROR, error as Error);
      throw error;
    }
  }

  /**
   * 连接到标准I/O流
   * @param options 选项
   */
  connectToStdio(options: StdioTransportOptions = {}): void {
    if (this.state === TransportConnectionState.CONNECTED) {
      return;
    }

    this.updateState(TransportConnectionState.CONNECTING);
    this.isChildProcess = false;

    try {
      // 连接标准流
      this.stdin = options.stdin || process.stdin;
      this.stdout = options.stdout || process.stdout;
      this.stderr = options.stderr || process.stderr;

      // 设置输入行阅读器
      this.setupInputReader();
      
      // 更新状态
      this.updateState(TransportConnectionState.CONNECTED);
      
      // 启动心跳
      this.startHeartbeat();
    } catch (error) {
      this.updateState(TransportConnectionState.ERROR, error as Error);
      throw error;
    }
  }

  /**
   * 发送消息
   * @param message 要发送的消息
   */
  async send(message: MCPMessage): Promise<void> {
    if (this.state !== TransportConnectionState.CONNECTED) {
      throw new Error('连接未建立或已关闭');
    }

    if (!this.stdin || !this.stdin.writable) {
      throw new Error('标准输入流不可写');
    }

    const messageJson = JSON.stringify(message) + '\n';

    return new Promise<void>((resolve, reject) => {
      this.stdin!.write(messageJson, 'utf8', (error) => {
        if (error) {
          this.updateState(TransportConnectionState.ERROR, error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    this.stopHeartbeat();

    // 关闭行阅读器
    if (this.inputLineReader) {
      this.inputLineReader.close();
      this.inputLineReader = null;
    }

    if (this.outputLineReader) {
      this.outputLineReader.close();
      this.outputLineReader = null;
    }

    // 如果是子进程模式，关闭子进程
    if (this.isChildProcess && this.process) {
      // 关闭标准流
      if (this.stdin && this.stdin.writable) {
        this.stdin.end();
      }

      // 退出子进程
      if (this.process.connected) {
        this.process.kill();
      }
      
      this.process = null;
    }

    this.stdin = null;
    this.stdout = null;
    this.stderr = null;

    this.updateState(TransportConnectionState.DISCONNECTED);
  }

  /**
   * 设置输入行阅读器
   */
  private setupInputReader(): void {
    if (!this.stdin) {
      return;
    }

    this.inputLineReader = readline.createInterface({
      input: this.stdin,
      crlfDelay: Infinity
    });

    this.inputLineReader.on('line', (line) => {
      this.processMessageLine(line);
    });

    this.inputLineReader.on('close', () => {
      if (this.state === TransportConnectionState.CONNECTED) {
        this.updateState(TransportConnectionState.DISCONNECTED);
      }
    });
  }

  /**
   * 设置输出行阅读器
   */
  private setupOutputReader(): void {
    if (!this.stdout) {
      return;
    }

    this.outputLineReader = readline.createInterface({
      input: this.stdout,
      crlfDelay: Infinity
    });

    this.outputLineReader.on('line', (line) => {
      this.processMessageLine(line);
    });

    this.outputLineReader.on('close', () => {
      if (this.state === TransportConnectionState.CONNECTED) {
        this.updateState(TransportConnectionState.DISCONNECTED);
      }
    });
  }

  /**
   * 处理消息行
   * @param line 行内容
   */
  private processMessageLine(line: string): void {
    try {
      // 尝试解析JSON消息
      const message = JSON.parse(line) as MCPMessage;
      this.handleMessage(message);
    } catch (error) {
      // 如果解析失败，先缓存起来
      this.messageBuffer += line;
      
      try {
        const message = JSON.parse(this.messageBuffer) as MCPMessage;
        this.handleMessage(message);
        this.messageBuffer = ''; // 成功解析后清空缓冲区
      } catch {
        // 仍然不是有效的JSON，继续累积
      }
    }
  }

  /**
   * 处理进程错误
   * @param error 错误对象
   */
  private handleProcessError(error: Error): void {
    this.updateState(TransportConnectionState.ERROR, error);
  }

  /**
   * 处理进程退出
   * @param code 退出码
   */
  private handleProcessExit(code: number | null): void {
    if (this.state !== TransportConnectionState.DISCONNECTED) {
      this.updateState(
        code === 0 ? TransportConnectionState.DISCONNECTED : TransportConnectionState.ERROR,
        code !== 0 ? new Error(`进程异常退出，退出码: ${code}`) : undefined
      );
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    const options = this.config.transportOptions as StdioTransportOptions;
    const interval = options?.heartbeatInterval || 30000; // 默认30秒
    
    this.heartbeatInterval = setInterval(() => {
      if (this.state === TransportConnectionState.CONNECTED) {
        // 发送心跳消息
        const heartbeatMessage: MCPMessage = {
          id: uuidv4(),
          type: 'heartbeat',
          timestamp: Date.now()
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
 * STDIO传输提供者
 */
export class StdioTransportProvider implements TransportProvider {
  readonly type = MCPTransportType.STDIO;
  
  /**
   * 创建连接
   * @param config 连接配置
   */
  async createConnection(config?: TransportConfig): Promise<TransportConnection> {
    const connection = new StdioConnection(config);
    const options = config?.transportOptions as StdioTransportOptions;
    
    if (options?.command) {
      // 子进程模式
      await connection.connectToChildProcess(
        options.command,
        options.args || [],
        options
      );
    } else {
      // 标准I/O模式
      connection.connectToStdio(options);
    }
    
    return connection;
  }

  /**
   * 监听传入连接
   * 对于STDIO传输，这会创建一个标准I/O连接
   */
  async listen(
    config: TransportConfig,
    connectionHandler: (connection: TransportConnection) => void
  ): Promise<void> {
    const connection = new StdioConnection(config);
    const options = config.transportOptions as StdioTransportOptions;
    
    connection.connectToStdio(options);
    connectionHandler(connection);
  }

  /**
   * 关闭传输提供者
   */
  async close(): Promise<void> {
    // STDIO提供者没有全局状态需要清理
  }
} 