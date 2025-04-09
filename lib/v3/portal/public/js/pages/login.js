/**
 * MCPM 开发者门户 登录页面
 * 
 * 处理用户登录功能
 */

const LoginPage = (function() {
  /**
   * 渲染登录页面
   * @param {HTMLElement} container - 页面容器
   */
  function render(container) {
    // 如果已登录，重定向到首页
    if (Auth.isAuthenticated()) {
      Router.navigate('/');
      return;
    }
    
    // 隐藏侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    
    // 设置主内容样式
    container.style.marginLeft = '0';
    
    // 创建登录表单
    container.innerHTML = `
      <div class="auth-container">
        <div class="auth-logo">
          <img src="./assets/logo.svg" alt="MCPM Logo">
        </div>
        <div class="auth-card">
          <h2 class="auth-title">登录开发者门户</h2>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="username" class="form-label">用户名</label>
              <input type="text" id="username" name="username" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="password" class="form-label">密码</label>
              <input type="password" id="password" name="password" class="form-input" required>
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary" style="width: 100%;">登录</button>
            </div>
          </form>
          <div class="auth-footer">
            <p>还没有账号？<a href="/register">注册</a></p>
          </div>
        </div>
      </div>
    `;
    
    // 添加登录表单提交事件
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        await Auth.login(username, password);
        
        // 登录成功后重置样式并跳转
        if (sidebar) {
          sidebar.style.display = '';
        }
        container.style.marginLeft = '';
        
        UI.showToast('success', '登录成功');
        Router.navigate('/');
      } catch (error) {
        UI.showToast('error', `登录失败: ${error.message}`);
      }
    });
  }
  
  // 公共API
  return {
    render
  };
})(); 