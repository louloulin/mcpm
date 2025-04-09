/**
 * MCPM 开发者门户 主应用脚本
 * 
 * 初始化应用并注册路由
 */

// 初始化应用
async function initApp() {
  // 初始化导航
  Navigation.init();
  
  // 注册路由
  Router.registerRoute('/', DashboardPage.render);
  Router.registerRoute('/services', ServicesPage.render);
  Router.registerRoute('/services/:id', ServicesPage.renderDetail);
  Router.registerRoute('/tools', ToolsPage.render);
  Router.registerRoute('/analytics', AnalyticsPage.render);
  Router.registerRoute('/login', LoginPage.render);
  Router.registerRoute('/register', RegisterPage.render);
  
  // 注册404路由
  Router.registerRoute('404', (container) => {
    container.innerHTML = `
      <div class="card">
        <h2>页面未找到</h2>
        <p>您请求的页面不存在。</p>
        <a href="/" class="btn btn-primary">
          <i class="fas fa-home"></i> 返回主页
        </a>
      </div>
    `;
  });
  
  // 初始化路由器
  Router.init();
  
  // 初始化身份验证
  await Auth.init();
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(error => {
    console.error('应用初始化失败:', error);
  });
}); 