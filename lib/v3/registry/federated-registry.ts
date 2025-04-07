/**
 * MCPM 3.0 联合注册表实现
 */

import { FederatedRegistryOptions, Registry, ServiceSearchOptions, ServiceSearchResult } from './types';
import { MCPServerDefinition } from '../../mcp/types';
import { RemoteRegistry } from './remote-registry';

/**
 * 联合注册表
 * 管理多个注册表源并提供统一的搜索和安装接口
 */
export class FederatedRegistry implements Registry {
  private sources: Map<string, Registry> = new Map();
  private options: FederatedRegistryOptions;

  /**
   * 创建联合注册表
   * @param options 联合注册表选项
   */
  constructor(options: FederatedRegistryOptions = {}) {
    this.options = {
      caching: true,
      parallelSearch: true,
      defaultLimit: 10,
      timeout: 5000,
      ...options
    };
  }

  /**
   * 添加注册表源
   * @param id 源ID
   * @param registry 注册表实例
   */
  addSource(id: string, registry: Registry): void {
    this.sources.set(id, registry);
  }

  /**
   * 移除注册表源
   * @param id 源ID
   */
  removeSource(id: string): void {
    this.sources.delete(id);
  }

  /**
   * 获取注册表源
   * @param id 源ID
   * @returns 注册表实例
   */
  getSource(id: string): Registry | undefined {
    return this.sources.get(id);
  }

  /**
   * 获取所有注册表源
   * @returns 注册表源ID数组
   */
  getSources(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * 搜索服务
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async search(options: ServiceSearchOptions = {}): Promise<ServiceSearchResult> {
    // 确保搜索限制合理
    const limit = options.limit || this.options.defaultLimit;
    const searchOptions: ServiceSearchOptions = {
      ...options,
      limit
    };

    // 结果集
    const results: ServiceSearchResult = {
      items: [],
      total: 0,
      offset: options.offset || 0,
      limit
    };

    // 查询每个源
    if (this.options.parallelSearch) {
      // 并行搜索
      const searchPromises = Array.from(this.sources.entries()).map(
        async ([sourceId, registry]) => {
          try {
            const result = await registry.search(searchOptions);
            // 添加源信息
            result.items = result.items.map(item => ({
              ...item,
              source: sourceId
            }));
            return result;
          } catch (error) {
            console.error(`搜索源 ${sourceId} 时出错:`, error);
            return null;
          }
        }
      );

      // 等待所有搜索完成
      const sourceResults = (await Promise.all(searchPromises)).filter(
        result => result !== null
      ) as ServiceSearchResult[];

      // 合并结果
      for (const result of sourceResults) {
        results.items = [...results.items, ...result.items];
        results.total += result.total;
      }
    } else {
      // 串行搜索
      for (const [sourceId, registry] of this.sources.entries()) {
        try {
          const result = await registry.search(searchOptions);
          // 添加源信息
          result.items = result.items.map(item => ({
            ...item,
            source: sourceId
          }));
          results.items = [...results.items, ...result.items];
          results.total += result.total;
        } catch (error) {
          console.error(`搜索源 ${sourceId} 时出错:`, error);
        }
      }
    }

    // 结果排序和限制
    results.items.sort((a, b) => a.name.localeCompare(b.name));
    results.items = results.items.slice(0, limit);

    return results;
  }

  /**
   * 获取服务详情
   * @param id 服务ID
   * @returns 服务详情
   */
  async getService(id: string): Promise<MCPServerDefinition> {
    // 遍历所有源
    for (const [sourceId, registry] of this.sources.entries()) {
      try {
        const service = await registry.getService(id);
        return service;
      } catch (error) {
        // 继续尝试下一个源
      }
    }

    // 所有源都没有找到
    throw new Error(`未找到服务: ${id}`);
  }

  /**
   * 安装服务
   * @param id 服务ID
   * @param destination 安装目标路径
   * @param options 安装选项
   * @returns 安装路径
   */
  async install(id: string, destination: string, options: Record<string, any> = {}): Promise<string> {
    // 遍历所有源
    for (const [sourceId, registry] of this.sources.entries()) {
      try {
        const installedPath = await registry.install(id, destination, options);
        return installedPath;
      } catch (error) {
        // 继续尝试下一个源
      }
    }

    // 所有源都没有找到或安装失败
    throw new Error(`未能安装服务: ${id}`);
  }
} 