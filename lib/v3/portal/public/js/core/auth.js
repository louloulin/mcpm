/**
 * MCPM 开发者门户 身份验证模块
 * 
 * 处理用户认证、令牌管理和权限检查
 */

const Auth = (function() {
  // 存储令牌的本地存储键
  const TOKEN_KEY = 'mcpm_portal_token';
  // 存储用户信息的本地存储键
  const USER_KEY = 'mcpm_portal_user';
  
  /**
   * 保存身份验证令牌和用户信息
   * @param {string} token - 身份验证令牌
   * @param {Object} user - 用户信息
   */
  function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  /**
   * 清除身份验证令牌和用户信息
   */
  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  
  /**
   * 获取身份验证令牌
   * @returns {string|null} - 身份验证令牌
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  
  /**
   * 获取当前用户信息
   * @returns {Object|null} - 用户信息
   */
  function getUser() {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson);
    } catch {
      clearAuth();
      return null;
    }
  }
  
  /**
   * 检查用户是否已登录
   * @returns {boolean} - 是否已登录
   */
  function isAuthenticated() {
    return !!getToken() && !!getUser();
  }
  
  /**
   * 检查用户是否具有特定角色
   * @param {string} role - 角色名称
   * @returns {boolean} - 是否具有该角色
   */
  function hasRole(role) {
    const user = getUser();
    return user && user.role === role;
  }
  
  /**
   * 检查用户是否拥有管理员权限
   * @returns {boolean} - 是否拥有管理员权限
   */
  function isAdmin() {
    return hasRole('admin');
  }
  
  // 公共API
  return {
    /**
     * 登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} - 登录结果
     */
    async login(username, password) {
      try {
        const result = await API.auth.login(username, password);
        saveAuth(result.token, result.user);
        return result;
      } catch (error) {
        throw error;
      }
    },
    
    /**
     * 注册
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>} - 注册结果
     */
    async register(userData) {
      try {
        return await API.auth.register(userData);
      } catch (error) {
        throw error;
      }
    },
    
    /**
     * 退出登录
     * @returns {Promise<void>}
     */
    async logout() {
      try {
        await API.auth.logout();
      } finally {
        clearAuth();
      }
    },
    
    /**
     * 初始化身份验证
     * @returns {Promise<void>}
     */
    async init() {
      // 检查身份验证状态
      if (isAuthenticated()) {
        // 如果已登录，更新UI
        const user = getUser();
        if (user) {
          // 更新用户菜单
          const userProfileEl = document.getElementById('user-profile');
          if (userProfileEl) {
            userProfileEl.innerHTML = `
              <div class="user-menu">
                <div class="user-info">
                  <span class="user-name">${user.username}</span>
                  <span class="user-role">${user.role}</span>
                </div>
                <button id="logout-button" class="btn btn-outline">
                  <i class="fas fa-sign-out-alt"></i> 退出
                </button>
              </div>
            `;
            
            // 添加退出按钮事件
            document.getElementById('logout-button').addEventListener('click', async () => {
              await Auth.logout();
              UI.showToast('success', '已退出登录');
              Router.navigate('/login');
            });
          }
        }
      } else {
        // 如果未登录，且不在登录页或注册页，则重定向到登录页
        const currentPath = Router.getCurrentPath();
        if (currentPath !== '/login' && currentPath !== '/register') {
          Router.navigate('/login');
        }
      }
    },
    
    // 导出工具函数
    getToken,
    getUser,
    clearToken: clearAuth,
    isAuthenticated,
    hasRole,
    isAdmin
  };
})(); 