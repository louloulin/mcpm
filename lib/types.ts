/**
 * 数据类型定义
 */

// 服务器类型
export interface Server {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  author_id?: string;
  author?: User;
  homepage?: string;
  repository?: string;
  license: string;
  tags: string[];
  tools: Tool[];
  requirements?: {
    node?: string;
    memory?: string;
    disk?: string;
    cpu?: string;
  };
  downloads: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedVersions?: {
    version: string;
    publishedAt: string;
    changelog?: string;
  }[];
}

// 工具类型
export interface Tool {
  id: string;
  name: string;
  description: string;
  schema: any;
  version: string;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  role: 'user' | 'admin';
  createdAt?: string;
  lastLoginAt?: string;
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