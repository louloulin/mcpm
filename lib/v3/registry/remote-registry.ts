/**
 * MCPM 3.0 远程注册表实现
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import axios from 'axios';
import { Registry, RemoteRegistryOptions, ServiceSearchOptions, ServiceSearchResult } from './types';
import { MCPServerDefinition } from '../../mcp/types';

// 文件系统Promise API
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

/**
 * 远程注册表
 * 与远程MCPM注册表服务器通信
 */
export class RemoteRegistry implements Registry {
  private options: RemoteRegistryOptions;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * 创建远程注册表
   * @param options 注册表选项
   */
  constructor(options: RemoteRegistryOptions) {
    this.options = {
      caching: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
      timeout: 10000, // 10秒超时
      priority: 100,
      ...options
    };

    // URL必须以/结尾
    if (!this.options.url.endsWith('/')) {
      this.options.url += '/';
    }
  }

  /**
   * 从缓存获取数据
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  private getCachedData<T>(key: string): T | null {
    if (!this.options.caching) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // 检查缓存是否过期
    const now = Date.now();
    if (now - cached.timestamp > (this.options.cacheTTL || 0)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 向缓存设置数据
   * @param key 缓存键
   * @param data 数据
   */
  private setCachedData<T>(key: string, data: T): void {
    if (!this.options.caching) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 创建带身份验证的请求头
   * @returns 请求头对象
   */
  private createHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCPM-CLI/3.0'
    };

    // 添加认证信息
    if (this.options.credentials) {
      headers['Authorization'] = `Bearer ${this.options.credentials}`;
    }

    return headers;
  }

  /**
   * 发起GET请求
   * @param path API路径
   * @param params 查询参数
   * @returns 响应数据
   */
  private async get<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    // 构建缓存键
    const cacheKey = `GET:${path}:${JSON.stringify(params)}`;

    // 尝试从缓存获取
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 发送请求
    try {
      const response = await axios.get<T>(`${this.options.url}${path}`, {
        params,
        headers: this.createHeaders(),
        timeout: this.options.timeout
      });

      // 保存到缓存
      this.setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`API错误 (${error.response.status}): ${error.response.data.message || JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          throw new Error(`请求错误: 无响应 - ${error.message}`);
        } else {
          throw new Error(`请求配置错误: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * 发起POST请求
   * @param path API路径
   * @param data 请求体数据
   * @returns 响应数据
   */
  private async post<T>(path: string, data: any): Promise<T> {
    try {
      const response = await axios.post<T>(`${this.options.url}${path}`, data, {
        headers: this.createHeaders(),
        timeout: this.options.timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`API错误 (${error.response.status}): ${error.response.data.message || JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          throw new Error(`请求错误: 无响应 - ${error.message}`);
        } else {
          throw new Error(`请求配置错误: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * 下载文件
   * @param url 文件URL
   * @param destination 保存路径
   * @returns 文件路径
   */
  private async downloadFile(url: string, destination: string): Promise<string> {
    try {
      // 创建目录
      await mkdir(path.dirname(destination), { recursive: true });

      // 下载文件
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: this.createHeaders(),
        timeout: this.options.timeout
      });

      // 写入文件
      await writeFile(destination, response.data);

      return destination;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`下载错误 (${error.response.status}): ${error.message}`);
        } else if (error.request) {
          throw new Error(`下载请求错误: 无响应 - ${error.message}`);
        } else {
          throw new Error(`下载配置错误: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * 搜索服务
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async search(options: ServiceSearchOptions = {}): Promise<ServiceSearchResult> {
    return this.get<ServiceSearchResult>('v3/services', {
      ...options,
      limit: options.limit || 10,
      offset: options.offset || 0
    });
  }

  /**
   * 获取服务详情
   * @param id 服务ID
   * @returns 服务详情
   */
  async getService(id: string): Promise<MCPServerDefinition> {
    return this.get<MCPServerDefinition>(`v3/services/${id}`);
  }

  /**
   * 安装服务
   * @param id 服务ID
   * @param destination 安装目标路径
   * @param options 安装选项
   * @returns 安装路径
   */
  async install(id: string, destination: string, options: Record<string, any> = {}): Promise<string> {
    // 获取服务详情
    const service = await this.getService(id);

    // 检查服务是否有安装URL
    if (!service.url) {
      throw new Error(`服务 ${id} 没有可用的安装URL`);
    }

    // 创建安装目录
    const installDir = path.join(destination, service.name);
    
    // 下载和解压服务
    await this.downloadFile(service.url, path.join(installDir, 'package.json'));

    // 返回安装路径
    return installDir;
  }
} 