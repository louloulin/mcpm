/**
 * MCPM 开发者门户 API客户端
 * 
 * 处理与后端服务的所有HTTP通信
 */

const API = (function() {
  // API基础路径
  const API_BASE_PATH = '/api/portal';
  
  // 默认请求选项
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  /**
   * 发送HTTP请求
   * @param {string} url - 请求地址
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应数据
   */
  async function request(url, options = {}) {
    // 合并默认选项
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // 添加身份认证令牌
    const token = Auth.getToken();
    if (token) {
      requestOptions.headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      // 发送请求
      const response = await fetch(url, requestOptions);
      
      // 检查响应状态
      if (response.status === 401) {
        // 未授权，清除令牌并跳转到登录页
        Auth.clearToken();
        Router.navigate('/login');
        throw new Error('未授权，请重新登录');
      }
      
      // 解析响应
      if (response.status >= 200 && response.status < 300) {
        // 正常响应
        if (response.status === 204) {
          return null; // No Content
        }
        return await response.json();
      } else {
        // 错误响应
        const error = await response.json();
        throw new Error(error.error || '请求失败');
      }
    } catch (error) {
      UI.showToast('error', error.message);
      throw error;
    }
  }
  
  // API模块
  return {
    /**
     * 认证API
     */
    auth: {
      /**
       * 用户登录
       * @param {string} username - 用户名
       * @param {string} password - 密码
       * @returns {Promise<Object>} - 登录结果
       */
      login: (username, password) => {
        return request(`${API_BASE_PATH}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
      },
      
      /**
       * 用户注册
       * @param {Object} userData - 用户数据
       * @returns {Promise<Object>} - 注册结果
       */
      register: (userData) => {
        return request(`${API_BASE_PATH}/auth/register`, {
          method: 'POST',
          body: JSON.stringify(userData)
        });
      },
      
      /**
       * 退出登录
       * @returns {Promise<void>}
       */
      logout: () => {
        return request(`${API_BASE_PATH}/auth/logout`, {
          method: 'POST'
        });
      }
    },
    
    /**
     * 服务API
     */
    services: {
      /**
       * 获取所有服务
       * @returns {Promise<Array>} - 服务列表
       */
      getAll: () => {
        return request(`${API_BASE_PATH}/services`);
      },
      
      /**
       * 获取单个服务详情
       * @param {string} id - 服务ID
       * @returns {Promise<Object>} - 服务详情
       */
      getById: (id) => {
        return request(`${API_BASE_PATH}/services/${id}`);
      },
      
      /**
       * 创建服务
       * @param {Object} serviceData - 服务数据
       * @returns {Promise<Object>} - 创建结果
       */
      create: (serviceData) => {
        return request(`${API_BASE_PATH}/services`, {
          method: 'POST',
          body: JSON.stringify(serviceData)
        });
      },
      
      /**
       * 更新服务
       * @param {string} id - 服务ID
       * @param {Object} serviceData - 服务数据
       * @returns {Promise<Object>} - 更新结果
       */
      update: (id, serviceData) => {
        return request(`${API_BASE_PATH}/services/${id}`, {
          method: 'PUT',
          body: JSON.stringify(serviceData)
        });
      },
      
      /**
       * 删除服务
       * @param {string} id - 服务ID
       * @returns {Promise<void>}
       */
      delete: (id) => {
        return request(`${API_BASE_PATH}/services/${id}`, {
          method: 'DELETE'
        });
      }
    },
    
    /**
     * 工具API
     */
    tools: {
      /**
       * 获取所有工具
       * @returns {Promise<Array>} - 工具列表
       */
      getAll: () => {
        return request(`${API_BASE_PATH}/tools`);
      },
      
      /**
       * 测试工具
       * @param {string} name - 工具名
       * @param {Object} parameters - 测试参数
       * @returns {Promise<Object>} - 测试结果
       */
      test: (name, parameters) => {
        return request(`${API_BASE_PATH}/tools/${name}/test`, {
          method: 'POST',
          body: JSON.stringify({ parameters })
        });
      }
    },
    
    /**
     * 分析API
     */
    analytics: {
      /**
       * 获取总体分析数据
       * @returns {Promise<Object>} - 分析数据
       */
      getOverview: () => {
        return request(`${API_BASE_PATH}/analytics`);
      },
      
      /**
       * 获取服务分析数据
       * @param {string} id - 服务ID
       * @returns {Promise<Object>} - 服务分析数据
       */
      getServiceAnalytics: (id) => {
        return request(`${API_BASE_PATH}/analytics/services/${id}`);
      }
    }
  };
})(); 