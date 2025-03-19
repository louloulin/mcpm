/**
 * API客户端工具
 * 封装了所有API调用，便于前端组件使用
 */

import { 
  Server, 
  User, 
  SyncRecord, 
  StatsOverview, 
  SearchResult, 
  PaginationParams,
  ApiError
} from './types';

// API请求基本路径
const API_BASE_URL = '/api/v1';

/**
 * API请求处理类
 */
class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 确保请求包含正确的内容类型头
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // 包含credentials以发送和接收cookies
    const config = {
      ...options,
      headers,
      credentials: 'include' as RequestCredentials,
    };
    
    try {
      const response = await fetch(url, config);
      
      // 解析响应数据
      const data = await response.json();
      
      // 检查API错误
      if (!response.ok) {
        const apiError: ApiError = data;
        throw new Error(apiError.error || `API错误: ${response.status}`);
      }
      
      return data as T;
    } catch (error) {
      // 重新抛出错误，添加更多上下文
      if (error instanceof Error) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw new Error('API请求失败: 未知错误');
    }
  }
  
  // ======= 服务器API ======= //
  
  /**
   * 获取所有服务器
   */
  async getAllServers(params?: PaginationParams): Promise<SearchResult<Server>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<SearchResult<Server>>(`/servers${query}`);
  }
  
  /**
   * 通过ID获取服务器
   */
  async getServerById(id: string): Promise<Server> {
    return this.request<Server>(`/servers/${id}`);
  }
  
  /**
   * 搜索服务器
   */
  async searchServers(
    query: string, 
    tags?: string[], 
    params?: PaginationParams
  ): Promise<SearchResult<Server>> {
    const queryParams = new URLSearchParams();
    
    queryParams.append('query', query);
    
    if (tags && tags.length > 0) {
      tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    return this.request<SearchResult<Server>>(`/servers/search?${queryParams.toString()}`);
  }
  
  /**
   * 创建服务器
   */
  async createServer(server: Partial<Server>): Promise<Server> {
    return this.request<Server>('/servers', {
      method: 'POST',
      body: JSON.stringify(server),
    });
  }
  
  /**
   * 更新服务器
   */
  async updateServer(id: string, updates: Partial<Server>): Promise<Server> {
    return this.request<Server>(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  
  /**
   * 删除服务器
   */
  async deleteServer(id: string): Promise<void> {
    return this.request<void>(`/servers/${id}`, {
      method: 'DELETE',
    });
  }
  
  // ======= 用户API ======= //
  
  /**
   * 获取当前登录用户
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }
  
  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }
  
  /**
   * 用户注册
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  
  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }
  
  /**
   * 更新用户资料
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  
  // ======= 同步API ======= //
  
  /**
   * 获取所有同步记录
   */
  async getAllSyncRecords(params?: PaginationParams): Promise<SearchResult<SyncRecord>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<SearchResult<SyncRecord>>(`/sync${query}`);
  }
  
  /**
   * 获取最新同步记录
   */
  async getLatestSyncRecord(): Promise<SyncRecord> {
    return this.request<SyncRecord>('/sync/latest');
  }
  
  /**
   * 触发同步操作（仅管理员）
   */
  async triggerSync(): Promise<SyncRecord> {
    return this.request<SyncRecord>('/sync/trigger', {
      method: 'POST',
    });
  }
  
  // ======= 统计API ======= //
  
  /**
   * 获取概览统计
   */
  async getStatsOverview(): Promise<StatsOverview> {
    return this.request<StatsOverview>('/stats/overview');
  }
  
  /**
   * 获取热门服务器
   */
  async getPopularServers(limit = 5): Promise<Server[]> {
    return this.request<Server[]>(`/stats/popular-servers?limit=${limit}`);
  }

  /**
   * 更新当前用户资料
   */
  async updateCurrentUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  /**
   * 更新用户密码
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request<void>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

// 导出API客户端单例
export const apiClient = new ApiClient();

// 导出API类型，便于导入
export type { 
  Server, 
  User, 
  SyncRecord, 
  StatsOverview, 
  SearchResult,
  PaginationParams,
  ApiError
}; 