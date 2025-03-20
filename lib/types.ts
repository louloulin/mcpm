/**
 * 数据类型定义
 */

// 服务器类型
export interface Server {
  id: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  author?: User;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  license: string;
  tools?: Tool[];
  publishedVersions?: VersionInfo[];
  requirements?: Requirements;
  homepage?: string;
  repository?: string;
}

// 工具类型
export interface Tool {
  id: string;
  name: string;
  description: string;
  version: string;
  schema: any; // 工具模式，实际应用中应该有更具体的类型
}

// 用户类型
export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

// 同步记录类型
export interface SyncRecord {
  id: number;
  source: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'success' | 'failed';
  itemsProcessed?: number;
  totalItems?: number;
  error?: string;
}

// 统计概览类型
export interface StatsOverview {
  summary: {
    serverCount: number;
    downloadCount: number;
    activeUsers: number;
  };
  dailyDownloads: {
    date: string;
    count: number;
  }[];
  popularServers: Server[];
}

// 搜索结果类型
export interface SearchResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// 分页参数类型
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// API错误类型
export interface ApiError {
  error: string;
  status?: number;
  details?: any;
}

export interface VersionInfo {
  version: string;
  publishedAt: string;
  changelog?: string;
}

export interface Requirements {
  node?: string;
  memory?: string;
  disk?: string;
  cpu?: string;
} 