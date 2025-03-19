/**
 * MCP标准集成模块入口
 */

// 导出验证器相关功能
export * from './validator';
export * from './validator/schema';
export * from './validator/health';

// 导出版本控制相关功能
export * from './version/semver';
export * from './version/dependency';

// 导出类型定义
export * from './types';

/**
 * MCP服务器注册表
 * 用于管理和查询MCP服务器
 */
import { MCPServerDefinition, MCPServerHealth, MCPServerHealthStatus } from './types';
import { validateMCPServerDefinition } from './validator';
import { checkMCPServerHealth } from './validator/health';
import { satisfiesRange } from './version/semver';
import { DependencyConflict, resolveDependencies } from './version/dependency';

export class MCPRegistry {
  private servers: Record<string, MCPServerDefinition> = {};
  private healthStatus: Record<string, MCPServerHealth> = {};
  
  /**
   * 注册一个MCP服务器
   * @param serverDef 服务器定义
   * @returns 注册是否成功，如果验证失败则返回false
   */
  registerServer(serverDef: MCPServerDefinition): boolean {
    const validationResult = validateMCPServerDefinition(serverDef);
    
    if (!validationResult.valid) {
      console.error('服务器定义验证失败:', validationResult.errors);
      return false;
    }
    
    // 确保服务器名称唯一
    if (this.servers[serverDef.name] && 
        this.servers[serverDef.name].version !== serverDef.version) {
      // 只允许相同版本的服务器被覆盖
      console.error(`服务器 ${serverDef.name} 已经存在，版本 ${this.servers[serverDef.name].version}`);
      return false;
    }
    
    // 检查依赖
    if (serverDef.dependencies) {
      const conflicts = resolveDependencies(serverDef.name, {
        ...this.servers,
        [serverDef.name]: serverDef // 临时加入当前服务器进行验证
      });
      
      if (conflicts.length > 0) {
        console.error('服务器依赖冲突:', conflicts);
        return false;
      }
    }
    
    // 保存服务器定义
    this.servers[serverDef.name] = serverDef;
    
    return true;
  }
  
  /**
   * 获取服务器定义
   * @param name 服务器名称
   * @returns 服务器定义，如果不存在则返回undefined
   */
  getServer(name: string): MCPServerDefinition | undefined {
    return this.servers[name];
  }
  
  /**
   * 获取所有服务器的列表
   * @returns 服务器定义数组
   */
  getAllServers(): MCPServerDefinition[] {
    return Object.values(this.servers);
  }
  
  /**
   * 查找满足过滤条件的服务器
   * @param filter 过滤函数
   * @returns 满足条件的服务器定义数组
   */
  findServers(filter: (server: MCPServerDefinition) => boolean): MCPServerDefinition[] {
    return Object.values(this.servers).filter(filter);
  }
  
  /**
   * 按标签查找服务器
   * @param tag 标签名称
   * @returns 包含指定标签的服务器定义数组
   */
  findServersByTag(tag: string): MCPServerDefinition[] {
    return this.findServers(server => server.tags?.includes(tag) || false);
  }
  
  /**
   * 获取服务器的健康状态
   * @param name 服务器名称
   * @returns 健康状态，如果尚未检查则返回undefined
   */
  getServerHealth(name: string): MCPServerHealth | undefined {
    return this.healthStatus[name];
  }
  
  /**
   * 检查服务器健康状态
   * @param name 服务器名称
   * @param timeout 超时时间，默认5000ms
   * @returns 健康检查结果
   */
  async checkServerHealth(name: string, timeout = 5000): Promise<MCPServerHealth> {
    const server = this.servers[name];
    
    if (!server) {
      const result: MCPServerHealth = {
        status: MCPServerHealthStatus.UNKNOWN,
        message: `未知的服务器: ${name}`,
        timestamp: new Date().toISOString()
      };
      this.healthStatus[name] = result;
      return result;
    }
    
    try {
      const health = await checkMCPServerHealth(server, timeout);
      this.healthStatus[name] = health;
      return health;
    } catch (error) {
      const result: MCPServerHealth = {
        status: MCPServerHealthStatus.UNHEALTHY,
        message: `健康检查失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
      this.healthStatus[name] = result;
      return result;
    }
  }
  
  /**
   * 检查所有服务器的健康状态
   * @param timeout 超时时间，默认5000ms
   * @returns 健康检查结果映射表
   */
  async checkAllServersHealth(timeout = 5000): Promise<Record<string, MCPServerHealth>> {
    const promises = Object.keys(this.servers).map(name => this.checkServerHealth(name, timeout));
    await Promise.all(promises);
    return this.healthStatus;
  }
  
  /**
   * 获取服务器的依赖冲突
   * @param name 服务器名称
   * @returns 依赖冲突数组
   */
  getServerDependencyConflicts(name: string): DependencyConflict[] {
    return resolveDependencies(name, this.servers);
  }
  
  /**
   * 查找指定版本范围的服务器
   * @param name 服务器名称
   * @param versionRange 版本范围
   * @returns 满足版本范围的服务器定义，如果不存在则返回undefined
   */
  findServerByVersion(name: string, versionRange: string): MCPServerDefinition | undefined {
    const server = this.servers[name];
    
    if (!server) {
      return undefined;
    }
    
    try {
      if (satisfiesRange(server.version, versionRange)) {
        return server;
      }
    } catch (err) {
      return undefined;
    }
    
    return undefined;
  }
} 