/**
 * 容器运行时接口定义
 * 定义与容器系统交互的标准接口
 */
import { MCPServerDefinition } from '../../../types';

/**
 * 容器配置接口
 * 定义运行容器所需的配置参数
 */
export interface ContainerConfig {
  // 容器镜像
  image: string;
  // 容器名称
  name?: string;
  // 环境变量
  env?: Record<string, string>;
  // 端口映射 hostPort:containerPort
  ports?: Record<string, string>;
  // 卷映射 hostPath:containerPath
  volumes?: Record<string, string>;
  // 工作目录
  workDir?: string;
  // 启动命令
  command?: string[];
  // 重启策略
  restartPolicy?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  // 资源限制
  resources?: {
    cpuLimit?: string;
    memoryLimit?: string;
    memoryReservation?: string;
  };
  // 网络配置
  network?: {
    name?: string;
    aliases?: string[];
    ipAddress?: string;
  };
  // 健康检查
  healthCheck?: {
    command: string[];
    interval?: number;
    timeout?: number;
    retries?: number;
    startPeriod?: number;
  };
  // 元数据标签
  labels?: Record<string, string>;
}

/**
 * 容器信息接口
 * 描述运行中容器的信息
 */
export interface ContainerInfo {
  // 容器ID
  id: string;
  // 容器名称
  name: string;
  // 镜像名称
  image: string;
  // 容器状态
  state: 'created' | 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  // 创建时间
  created: string;
  // 启动时间
  started?: string;
  // 退出时间
  finished?: string;
  // 退出代码
  exitCode?: number;
  // 运行时信息
  stats?: {
    cpuUsage?: number;
    memoryUsage?: string;
    networkRx?: string;
    networkTx?: string;
  };
  // 端口映射
  ports?: Record<string, string>;
  // 卷映射
  volumes?: Record<string, string>;
  // IP地址
  ipAddress?: string;
  // 容器网络
  network?: string;
  // 环境变量
  env?: Record<string, string>;
  // 标签
  labels?: Record<string, string>;
}

/**
 * 容器日志选项
 */
export interface ContainerLogOptions {
  // 返回的日志行数
  tail?: number;
  // 是否包含时间戳
  timestamps?: boolean;
  // 是否持续跟踪日志
  follow?: boolean;
  // 起始时间
  since?: string | Date;
  // 结束时间
  until?: string | Date;
}

/**
 * 容器运行时接口
 * 定义与容器系统交互的核心功能
 */
export interface ContainerRuntime {
  /**
   * 运行容器
   * @param serverDef MCP服务器定义
   * @param config 容器配置
   * @returns 容器信息
   */
  runContainer(serverDef: MCPServerDefinition, config: ContainerConfig): Promise<ContainerInfo>;
  
  /**
   * 停止容器
   * @param containerId 容器ID
   * @param timeout 等待容器停止的超时时间(秒)
   * @returns 操作是否成功
   */
  stopContainer(containerId: string, timeout?: number): Promise<boolean>;
  
  /**
   * 重启容器
   * @param containerId 容器ID
   * @param timeout 等待容器停止的超时时间(秒)
   * @returns 更新的容器信息
   */
  restartContainer(containerId: string, timeout?: number): Promise<ContainerInfo>;
  
  /**
   * 删除容器
   * @param containerId 容器ID
   * @param force 是否强制删除运行中的容器
   * @returns 操作是否成功
   */
  removeContainer(containerId: string, force?: boolean): Promise<boolean>;
  
  /**
   * 获取容器信息
   * @param containerId 容器ID
   * @returns 容器信息
   */
  getContainerInfo(containerId: string): Promise<ContainerInfo>;
  
  /**
   * 获取容器日志
   * @param containerId 容器ID
   * @param options 日志选项
   * @returns 容器日志内容
   */
  getContainerLogs(containerId: string, options?: ContainerLogOptions): Promise<string>;
  
  /**
   * 在容器中执行命令
   * @param containerId 容器ID
   * @param command 要执行的命令
   * @returns 命令输出
   */
  execCommand(containerId: string, command: string[]): Promise<string>;
  
  /**
   * 检查容器健康状态
   * @param containerId 容器ID
   * @returns 健康状态
   */
  checkHealth(containerId: string): Promise<'healthy' | 'unhealthy' | 'starting' | 'unknown'>;
  
  /**
   * 列出所有容器
   * @param all 是否包括停止的容器
   * @param filters 过滤条件
   * @returns 容器信息数组
   */
  listContainers(all?: boolean, filters?: Record<string, string>): Promise<ContainerInfo[]>;
  
  /**
   * 获取容器资源使用统计
   * @param containerId 容器ID
   * @returns 资源使用统计
   */
  getStats(containerId: string): Promise<ContainerInfo['stats']>;
} 