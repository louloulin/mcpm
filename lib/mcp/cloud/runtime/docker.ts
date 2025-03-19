/**
 * Docker容器运行时实现
 */
import { ContainerRuntime, ContainerConfig, ContainerInfo, ContainerLogOptions } from './container';
import { MCPServerDefinition } from '../../types';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 将exec转换为Promise版本
const execAsync = promisify(exec);

/**
 * Docker容器运行时实现
 * 通过shell命令与Docker交互
 */
export class DockerRuntime implements ContainerRuntime {
  /**
   * 检查Docker是否已安装
   * @returns 是否已安装
   */
  async isDockerInstalled(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 创建并启动容器
   * @param serverDef MCP服务器定义
   * @param config 容器配置
   * @returns 容器信息
   */
  async runContainer(serverDef: MCPServerDefinition, config: ContainerConfig): Promise<ContainerInfo> {
    if (!await this.isDockerInstalled()) {
      throw new Error('Docker未安装或无法访问');
    }
    
    // 准备启动命令
    const args: string[] = ['run', '-d'];
    
    // 设置容器名称
    const containerName = config.name || `mcp-server-${serverDef.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
    args.push('--name', containerName);
    
    // 添加环境变量
    if (config.env) {
      Object.entries(config.env).forEach(([key, value]) => {
        args.push('-e', `${key}=${value}`);
      });
    }
    
    // 添加端口映射
    if (config.ports) {
      Object.entries(config.ports).forEach(([host, container]) => {
        args.push('-p', `${host}:${container}`);
      });
    }
    
    // 添加卷映射
    if (config.volumes) {
      Object.entries(config.volumes).forEach(([host, container]) => {
        args.push('-v', `${host}:${container}`);
      });
    }
    
    // 设置重启策略
    if (config.restartPolicy) {
      args.push('--restart', config.restartPolicy);
    }
    
    // 设置资源限制
    if (config.resources) {
      if (config.resources.cpuLimit) {
        args.push('--cpus', config.resources.cpuLimit);
      }
      if (config.resources.memoryLimit) {
        args.push('--memory', config.resources.memoryLimit);
      }
      if (config.resources.memoryReservation) {
        args.push('--memory-reservation', config.resources.memoryReservation);
      }
    }
    
    // 设置网络
    if (config.network?.name) {
      args.push('--network', config.network.name);
      
      if (config.network.aliases) {
        config.network.aliases.forEach(alias => {
          args.push('--network-alias', alias);
        });
      }
      
      if (config.network.ipAddress) {
        args.push('--ip', config.network.ipAddress);
      }
    }
    
    // 设置健康检查
    if (config.healthCheck) {
      args.push('--health-cmd', config.healthCheck.command.join(' '));
      
      if (config.healthCheck.interval) {
        args.push('--health-interval', `${config.healthCheck.interval}s`);
      }
      
      if (config.healthCheck.timeout) {
        args.push('--health-timeout', `${config.healthCheck.timeout}s`);
      }
      
      if (config.healthCheck.retries) {
        args.push('--health-retries', `${config.healthCheck.retries}`);
      }
      
      if (config.healthCheck.startPeriod) {
        args.push('--health-start-period', `${config.healthCheck.startPeriod}s`);
      }
    }
    
    // 设置标签
    if (config.labels) {
      Object.entries(config.labels).forEach(([key, value]) => {
        args.push('--label', `${key}=${value}`);
      });
    }
    
    // 添加MCP服务器元数据标签
    args.push('--label', `mcp.server.name=${serverDef.name}`);
    args.push('--label', `mcp.server.version=${serverDef.version}`);
    args.push('--label', `mcp.server.type=${serverDef.type}`);
    args.push('--label', `mcp.server.url=${serverDef.url}`);
    
    // 设置工作目录
    if (config.workDir) {
      args.push('-w', config.workDir);
    }
    
    // 添加镜像名称
    args.push(config.image);
    
    // 添加启动命令
    if (config.command && config.command.length > 0) {
      args.push(...config.command);
    }
    
    // 执行docker run命令
    try {
      const { stdout } = await execAsync(`docker ${args.join(' ')}`);
      const containerId = stdout.trim();
      
      // 获取容器信息
      return await this.getContainerInfo(containerId);
    } catch (error) {
      throw new Error(`启动容器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 停止容器
   * @param containerId 容器ID
   * @param timeout 等待容器停止的超时时间(秒)
   * @returns 操作是否成功
   */
  async stopContainer(containerId: string, timeout?: number): Promise<boolean> {
    try {
      const timeoutArg = timeout ? ` -t ${timeout}` : '';
      await execAsync(`docker stop${timeoutArg} ${containerId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 重启容器
   * @param containerId 容器ID
   * @param timeout 等待容器停止的超时时间(秒)
   * @returns 更新的容器信息
   */
  async restartContainer(containerId: string, timeout?: number): Promise<ContainerInfo> {
    try {
      const timeoutArg = timeout ? ` -t ${timeout}` : '';
      await execAsync(`docker restart${timeoutArg} ${containerId}`);
      return await this.getContainerInfo(containerId);
    } catch (error) {
      throw new Error(`重启容器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 删除容器
   * @param containerId 容器ID
   * @param force 是否强制删除运行中的容器
   * @returns 操作是否成功
   */
  async removeContainer(containerId: string, force?: boolean): Promise<boolean> {
    try {
      const forceArg = force ? ' -f' : '';
      await execAsync(`docker rm${forceArg} ${containerId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取容器信息
   * @param containerId 容器ID
   * @returns 容器信息
   */
  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    try {
      // 使用docker inspect获取详细信息
      const { stdout: inspectJson } = await execAsync(`docker inspect ${containerId}`);
      const inspect = JSON.parse(inspectJson)[0];
      
      // 提取基本信息
      const info: ContainerInfo = {
        id: inspect.Id,
        name: inspect.Name.replace(/^\//, ''), // 移除名称前面的斜杠
        image: inspect.Config.Image,
        state: this.mapContainerState(inspect.State),
        created: inspect.Created,
        ports: this.extractPorts(inspect),
        volumes: this.extractVolumes(inspect),
        ipAddress: this.extractIpAddress(inspect),
        network: Object.keys(inspect.NetworkSettings.Networks)[0],
        env: this.extractEnv(inspect.Config.Env),
        labels: inspect.Config.Labels || {}
      };
      
      // 提取启动和退出时间
      if (inspect.State.StartedAt && inspect.State.StartedAt !== '0001-01-01T00:00:00Z') {
        info.started = inspect.State.StartedAt;
      }
      
      if (inspect.State.FinishedAt && inspect.State.FinishedAt !== '0001-01-01T00:00:00Z') {
        info.finished = inspect.State.FinishedAt;
      }
      
      // 提取退出代码
      if (info.state === 'exited' && inspect.State.ExitCode !== undefined) {
        info.exitCode = inspect.State.ExitCode;
      }
      
      // 获取资源使用统计
      if (info.state === 'running') {
        try {
          info.stats = await this.getStats(containerId);
        } catch (error) {
          // 忽略获取统计信息的错误
          console.warn(`获取容器统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return info;
    } catch (error) {
      throw new Error(`获取容器信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取容器日志
   * @param containerId 容器ID
   * @param options 日志选项
   * @returns 容器日志内容
   */
  async getContainerLogs(containerId: string, options?: ContainerLogOptions): Promise<string> {
    try {
      const args: string[] = ['logs'];
      
      // 添加日志选项
      if (options) {
        if (options.tail !== undefined) {
          args.push(`--tail=${options.tail}`);
        }
        
        if (options.timestamps) {
          args.push('--timestamps');
        }
        
        if (options.follow) {
          args.push('--follow');
        }
        
        if (options.since) {
          const since = typeof options.since === 'string' 
            ? options.since 
            : Math.floor(options.since.getTime() / 1000);
          args.push(`--since=${since}`);
        }
        
        if (options.until) {
          const until = typeof options.until === 'string' 
            ? options.until 
            : Math.floor(options.until.getTime() / 1000);
          args.push(`--until=${until}`);
        }
      }
      
      // 添加容器ID
      args.push(containerId);
      
      // 执行docker logs命令
      const { stdout } = await execAsync(`docker ${args.join(' ')}`);
      return stdout;
    } catch (error) {
      throw new Error(`获取容器日志失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 执行命令
   * @param containerId 容器ID
   * @param command 要执行的命令
   * @returns 命令输出
   */
  async execCommand(containerId: string, command: string[]): Promise<string> {
    try {
      // 准备命令
      const cmdArgs = command.map(arg => JSON.stringify(arg)).join(' ');
      const { stdout } = await execAsync(`docker exec ${containerId} ${cmdArgs}`);
      return stdout;
    } catch (error) {
      throw new Error(`执行命令失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 检查容器健康状态
   * @param containerId 容器ID
   * @returns 健康状态
   */
  async checkHealth(containerId: string): Promise<'healthy' | 'unhealthy' | 'starting' | 'unknown'> {
    try {
      const { stdout: inspectJson } = await execAsync(`docker inspect ${containerId}`);
      const inspect = JSON.parse(inspectJson)[0];
      
      // 检查容器是否配置了健康检查
      if (!inspect.State.Health) {
        return 'unknown';
      }
      
      // 返回健康状态
      switch (inspect.State.Health.Status) {
        case 'healthy':
          return 'healthy';
        case 'unhealthy':
          return 'unhealthy';
        case 'starting':
          return 'starting';
        default:
          return 'unknown';
      }
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * 列出所有容器
   * @param all 是否包括停止的容器
   * @param filters 过滤条件
   * @returns 容器信息数组
   */
  async listContainers(all?: boolean, filters?: Record<string, string>): Promise<ContainerInfo[]> {
    try {
      const args: string[] = ['ps'];
      
      // 是否包括所有容器
      if (all) {
        args.push('-a');
      }
      
      // 添加过滤条件
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          args.push(`--filter=${key}=${value}`);
        });
      }
      
      // 设置输出格式为JSON
      args.push('--format="{{json .}}"');
      
      // 执行docker ps命令
      const { stdout } = await execAsync(`docker ${args.join(' ')}`);
      
      // 解析输出
      const containers = stdout.trim().split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          // 移除JSON字符串周围的引号
          const json = line.trim().replace(/^"|"$/g, '');
          return JSON.parse(json);
        });
      
      // 获取详细信息
      const containerInfos: ContainerInfo[] = [];
      for (const container of containers) {
        try {
          const info = await this.getContainerInfo(container.ID);
          containerInfos.push(info);
        } catch (error) {
          console.warn(`获取容器${container.ID}信息失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return containerInfos;
    } catch (error) {
      throw new Error(`列出容器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取容器资源使用统计
   * @param containerId 容器ID
   * @returns 资源使用统计
   */
  async getStats(containerId: string): Promise<ContainerInfo['stats']> {
    try {
      // 执行docker stats命令，获取一次性统计信息
      const { stdout } = await execAsync(`docker stats ${containerId} --no-stream --format "{{json .}}"`);
      const stats = JSON.parse(stdout.trim());
      
      return {
        cpuUsage: parseFloat(stats.CPUPerc?.replace('%', '')) || 0,
        memoryUsage: stats.MemUsage?.split(' / ')[0] || '0B',
        networkRx: stats.NetIO?.split(' / ')[0] || '0B',
        networkTx: stats.NetIO?.split(' / ')[1] || '0B'
      };
    } catch (error) {
      throw new Error(`获取容器统计信息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 创建Docker网络
   * @param name 网络名称
   * @param driver 网络驱动类型
   * @returns 操作是否成功
   */
  async createNetwork(name: string, driver: string = 'bridge'): Promise<boolean> {
    try {
      await execAsync(`docker network create ${name} --driver ${driver}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 生成Dockerfile
   * @param content Dockerfile内容
   * @returns Dockerfile路径
   */
  async generateDockerfile(content: string): Promise<string> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-docker-'));
    const dockerfilePath = path.join(tempDir, 'Dockerfile');
    fs.writeFileSync(dockerfilePath, content);
    return dockerfilePath;
  }
  
  /**
   * 构建Docker镜像
   * @param dockerfilePath Dockerfile路径
   * @param tag 镜像标签
   * @param buildArgs 构建参数
   * @returns 镜像ID
   */
  async buildImage(dockerfilePath: string, tag: string, buildArgs?: Record<string, string>): Promise<string> {
    try {
      const args: string[] = ['build'];
      
      // 添加标签
      args.push('-t', tag);
      
      // 添加构建参数
      if (buildArgs) {
        Object.entries(buildArgs).forEach(([key, value]) => {
          args.push('--build-arg', `${key}=${value}`);
        });
      }
      
      // 添加Dockerfile路径
      args.push('-f', dockerfilePath);
      
      // 添加构建上下文 (Dockerfile所在目录)
      args.push(path.dirname(dockerfilePath));
      
      // 执行docker build命令
      const { stdout } = await execAsync(`docker ${args.join(' ')}`);
      
      // 提取镜像ID
      const match = stdout.match(/Successfully built ([a-f0-9]+)/);
      if (match && match[1]) {
        return match[1];
      }
      
      throw new Error('无法提取构建的镜像ID');
    } catch (error) {
      throw new Error(`构建镜像失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 映射Docker容器状态
   * @param state Docker容器状态对象
   * @returns 标准化的容器状态
   */
  private mapContainerState(state: any): ContainerInfo['state'] {
    if (state.Running && !state.Paused && !state.Restarting && !state.Dead) {
      return 'running';
    } else if (state.Paused) {
      return 'paused';
    } else if (state.Restarting) {
      return 'restarting';
    } else if (state.Dead) {
      return 'dead';
    } else if (!state.Running) {
      return 'exited';
    } else {
      return 'created';
    }
  }
  
  /**
   * 提取端口映射
   * @param inspect Docker inspect输出
   * @returns 端口映射
   */
  private extractPorts(inspect: any): Record<string, string> {
    const ports: Record<string, string> = {};
    const portBindings = inspect.NetworkSettings.Ports || {};
    
    for (const containerPort in portBindings) {
      const bindings = portBindings[containerPort];
      if (Array.isArray(bindings) && bindings.length > 0) {
        const binding = bindings[0];
        ports[binding.HostPort] = containerPort.split('/')[0]; // 移除协议部分 (tcp/udp)
      }
    }
    
    return ports;
  }
  
  /**
   * 提取卷映射
   * @param inspect Docker inspect输出
   * @returns 卷映射
   */
  private extractVolumes(inspect: any): Record<string, string> {
    const volumes: Record<string, string> = {};
    const mounts = inspect.Mounts || [];
    
    for (const mount of mounts) {
      if (mount.Type === 'bind' || mount.Type === 'volume') {
        volumes[mount.Source] = mount.Destination;
      }
    }
    
    return volumes;
  }
  
  /**
   * 提取IP地址
   * @param inspect Docker inspect输出
   * @returns IP地址
   */
  private extractIpAddress(inspect: any): string | undefined {
    const networks = inspect.NetworkSettings.Networks || {};
    const networkName = Object.keys(networks)[0];
    
    if (networkName && networks[networkName]) {
      return networks[networkName].IPAddress;
    }
    
    return undefined;
  }
  
  /**
   * 提取环境变量
   * @param envArray 环境变量数组
   * @returns 环境变量对象
   */
  private extractEnv(envArray: string[]): Record<string, string> {
    const env: Record<string, string> = {};
    
    if (Array.isArray(envArray)) {
      for (const item of envArray) {
        const parts = item.split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('=');
          env[key] = value;
        }
      }
    }
    
    return env;
  }
} 