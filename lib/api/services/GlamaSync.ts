import axios from 'axios';
import ServerModel, { ServerInput } from '../models/ServerModel';

/**
 * Glama数据同步服务
 */
export class GlamaSync {
  private apiUrl: string;
  private apiKey: string;
  
  constructor() {
    this.apiUrl = process.env.GLAMA_API_URL || 'https://api.glama.ai';
    this.apiKey = process.env.GLAMA_API_KEY || '';
  }
  
  /**
   * 执行同步
   */
  async sync() {
    try {
      const servers = await this.fetchServersFromGlama();
      const result = await this.processServers(servers);
      return result;
    } catch (error: any) {
      console.error('Glama同步失败:', error);
      throw new Error(`Glama同步失败: ${error.message}`);
    }
  }
  
  /**
   * 从Glama获取MCP服务器列表
   */
  private async fetchServersFromGlama() {
    try {
      // 实际环境中，这里应该会有分页机制
      const response = await axios.get(`${this.apiUrl}/mcp/servers`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('无法获取Glama服务器列表');
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(`获取Glama服务器失败: ${error.message}`);
    }
  }
  
  /**
   * 处理获取到的服务器数据
   */
  private async processServers(servers: any[]) {
    const result = {
      total: servers.length,
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    for (const server of servers) {
      try {
        const serverData = this.transformGlamaServer(server);
        const existingServer = ServerModel.getByKey(serverData.key);
        
        if (existingServer) {
          // 更新服务器
          ServerModel.update(existingServer.id, serverData);
          result.updated++;
        } else {
          // 创建服务器
          ServerModel.create(serverData);
          result.created++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`处理服务器 ${server.name || 'unknown'} 失败: ${error.message}`);
      }
    }
    
    return result;
  }
  
  /**
   * 将Glama格式转换为本地格式
   */
  private transformGlamaServer(glamaServer: any): ServerInput {
    // 这里的转换逻辑需要根据Glama的实际API结构调整
    return {
      name: glamaServer.name,
      key: glamaServer.id || glamaServer.key, // 使用Glama ID作为唯一标识符
      version: glamaServer.version || '1.0.0',
      description: glamaServer.description,
      homepage: glamaServer.homepage || glamaServer.url,
      license: glamaServer.license,
      command: glamaServer.command,
      args: glamaServer.args || [],
      env: this.transformEnvVars(glamaServer.env),
      tools: this.transformTools(glamaServer.tools || glamaServer.schema),
      tags: glamaServer.tags || [],
      compatibleClients: glamaServer.compatibleClients || ['claude']
    };
  }
  
  /**
   * 转换环境变量
   */
  private transformEnvVars(env: any): { key: string; value?: string }[] {
    if (!env) return [];
    
    // 如果是对象，转换为键值对数组
    if (typeof env === 'object' && !Array.isArray(env)) {
      return Object.entries(env).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }));
    }
    
    // 如果已经是数组，确保格式正确
    if (Array.isArray(env)) {
      return env.map(item => {
        if (typeof item === 'string') {
          return { key: item };
        }
        return {
          key: item.key || item.name,
          value: item.value
        };
      });
    }
    
    return [];
  }
  
  /**
   * 转换工具定义
   */
  private transformTools(tools: any): { name: string; description?: string; parameters?: any[] }[] {
    if (!tools) return [];
    
    // 处理不同的工具格式
    if (typeof tools === 'object' && !Array.isArray(tools)) {
      // 处理schema对象格式
      if (tools.properties) {
        const toolNames = Object.keys(tools.properties);
        return toolNames.map(name => {
          const tool = tools.properties[name];
          return {
            name,
            description: tool.description,
            parameters: this.transformParameters(tool.properties)
          };
        });
      }
      
      // 如果是简单对象列表
      return Object.entries(tools).map(([name, tool]: [string, any]) => ({
        name,
        description: tool.description,
        parameters: this.transformParameters(tool.parameters || tool.properties)
      }));
    }
    
    // 如果已经是数组，确保格式正确
    if (Array.isArray(tools)) {
      return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: this.transformParameters(tool.parameters || tool.arguments)
      }));
    }
    
    return [];
  }
  
  /**
   * 转换参数定义
   */
  private transformParameters(params: any): { name: string; type: string; description?: string; required: boolean }[] {
    if (!params) return [];
    
    // 如果是对象，转换为参数数组
    if (typeof params === 'object' && !Array.isArray(params)) {
      return Object.entries(params).map(([name, param]: [string, any]) => ({
        name,
        type: param.type || 'string',
        description: param.description,
        required: param.required === true
      }));
    }
    
    // 如果已经是数组，确保格式正确
    if (Array.isArray(params)) {
      return params.map(param => ({
        name: param.name,
        type: param.type || 'string',
        description: param.description,
        required: param.required === true
      }));
    }
    
    return [];
  }
} 