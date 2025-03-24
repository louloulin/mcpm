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

export interface DeveloperStats {
  totalServers: number;
  totalDownloads: number;
  averageRating: number;
  mostPopularServer: {
    id: string;
    name: string;
    key: string;
    downloads: number;
    rating: string;
  } | null;
  recentServers: Array<{
    id: string;
    name: string;
    key: string;
    createdAt: Date | null;
    downloads: number;
  }>;
  downloadTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * API请求处理类
 */
class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      // 合并默认选项
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      };

      const mergedOptions = { ...defaultOptions, ...options };
      
      // 尝试从localStorage添加令牌（如果存在且请求头中没有）
      if (typeof window !== 'undefined' && 
          mergedOptions.headers && 
          !('Authorization' in (mergedOptions.headers as Record<string, string>))) {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          mergedOptions.headers = {
            ...mergedOptions.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }

      console.log(`API请求: ${url}`, {
        method: mergedOptions.method || 'GET',
        hasAuthHeader: !!(mergedOptions.headers && 
          'Authorization' in (mergedOptions.headers as Record<string, string>))
      });

      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        // 特殊处理401错误
        if (response.status === 401) {
          console.error('认证失败 (401)，可能需要重新登录');
          // 这里可以触发重定向到登录页面或其他处理
        }
        
        const errorData = await response.json().catch(() => ({
          message: 'Unknown error occurred'
        }));
        
        console.error(`API请求失败 (${response.status}):`, errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      // 对于204 No Content响应，返回空对象
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API请求过程中发生错误:', error);
      throw error;
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
    return this.request<User>('/auth/me');
  }
  
  /**
   * 用户登录
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log("正在尝试登录，邮箱:", email);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("登录API响应非200:", response.status, error);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log("登录成功，收到响应数据:", {
        hasToken: !!data.token,
        hasUser: !!data.user
      });
      
      // 保存令牌到localStorage和sessionStorage作为备选
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_token', data.token);
        console.log("令牌已保存到本地存储");
      }

      // 在成功登录后确认cookie已设置
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          console.log("登录后Cookie检查:", document.cookie);
        }
      }, 100);

      return data;
    } catch (error) {
      console.error("登录过程中发生错误:", error);
      throw error;
    }
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
    try {
      console.log("正在尝试注销");
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("注销API响应非200:", response.status, error);
        throw new Error(error.message || 'Logout failed');
      }

      // 清除本地存储中的令牌
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        console.log("本地存储中的令牌已清除");
      }

      // 检查cookie是否已清除
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          console.log("注销后Cookie检查:", document.cookie);
        }
      }, 100);

      return await response.json();
    } catch (error) {
      console.error("注销过程中发生错误:", error);
      throw error;
    }
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

  async getDeveloperStats(): Promise<DeveloperStats> {
    const response = await fetch('/api/stats/developer', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取开发者统计数据失败');
    }

    return response.json();
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