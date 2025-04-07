/**
 * MCPM 3.0 注册表类型定义
 */

import { MCPServerDefinition } from '../../mcp/types';

/**
 * 远程注册表配置选项
 */
export interface RemoteRegistryOptions {
  /**
   * 注册表URL
   */
  url: string;
  
  /**
   * 注册表优先级（数字越小，优先级越高）
   */
  priority?: number;
  
  /**
   * 身份验证凭据
   */
  credentials?: string;
  
  /**
   * 是否启用缓存
   */
  caching?: boolean;
  
  /**
   * 缓存有效期（毫秒）
   */
  cacheTTL?: number;
  
  /**
   * 请求超时（毫秒）
   */
  timeout?: number;
}

/**
 * 服务搜索选项
 */
export interface ServiceSearchOptions {
  /**
   * 搜索关键词
   */
  query?: string;
  
  /**
   * 标签过滤
   */
  tags?: string[];
  
  /**
   * 作者过滤
   */
  author?: string;
  
  /**
   * 类别过滤
   */
  category?: string;
  
  /**
   * 结果限制数量
   */
  limit?: number;
  
  /**
   * 结果偏移量
   */
  offset?: number;
  
  /**
   * 排序字段
   */
  sort?: 'name' | 'version' | 'downloads' | 'rating' | 'updated';
  
  /**
   * 排序方向
   */
  order?: 'asc' | 'desc';
}

/**
 * 服务搜索结果项
 */
export interface ServiceSearchResultItem {
  /**
   * 服务ID
   */
  id: string;
  
  /**
   * 服务名称
   */
  name: string;
  
  /**
   * 服务版本
   */
  version: string;
  
  /**
   * 服务描述
   */
  description?: string;
  
  /**
   * 服务标签
   */
  tags?: string[];
  
  /**
   * 作者
   */
  author?: string;
  
  /**
   * 下载次数
   */
  downloads?: number;
  
  /**
   * 评分（1-5）
   */
  rating?: number;
  
  /**
   * 更新时间
   */
  updatedAt?: string;
  
  /**
   * 注册表源ID
   */
  source: string;
  
  /**
   * 安装URL
   */
  installUrl?: string;
}

/**
 * 服务搜索结果
 */
export interface ServiceSearchResult {
  /**
   * 结果项列表
   */
  items: ServiceSearchResultItem[];
  
  /**
   * 总结果数
   */
  total: number;
  
  /**
   * 当前偏移量
   */
  offset: number;
  
  /**
   * 限制数量
   */
  limit: number;
}

/**
 * 注册表接口
 */
export interface Registry {
  /**
   * 搜索服务
   * @param options 搜索选项
   */
  search(options?: ServiceSearchOptions): Promise<ServiceSearchResult>;
  
  /**
   * 获取服务详情
   * @param id 服务ID
   */
  getService(id: string): Promise<MCPServerDefinition>;
  
  /**
   * 安装服务
   * @param id 服务ID
   * @param destination 安装目标路径
   * @param options 安装选项
   */
  install(id: string, destination: string, options?: Record<string, any>): Promise<string>;
}

/**
 * 联合注册表选项
 */
export interface FederatedRegistryOptions {
  /**
   * 是否启用缓存
   */
  caching?: boolean;
  
  /**
   * 是否并行搜索所有源
   */
  parallelSearch?: boolean;
  
  /**
   * 默认搜索结果限制
   */
  defaultLimit?: number;
  
  /**
   * 默认超时（毫秒）
   */
  timeout?: number;
} 