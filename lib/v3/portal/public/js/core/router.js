/**
 * MCPM 开发者门户 路由器
 * 
 * 管理单页应用的路由导航
 */

const Router = (function() {
  // 存储路由处理程序
  const routes = {};
  
  // 当前活动路由
  let currentPath = '';
  
  /**
   * 注册路由处理程序
   * @param {string} path - 路由路径
   * @param {Function} handler - 处理函数
   */
  function registerRoute(path, handler) {
    routes[path] = handler;
  }
  
  /**
   * 获取当前路径
   * @returns {string} - 当前路径
   */
  function getCurrentPath() {
    return currentPath;
  }
  
  /**
   * 导航到指定路径
   * @param {string} path - 目标路径
   */
  function navigate(path) {
    // 更新地址栏
    window.history.pushState(null, '', path);
    
    // 处理路由变化
    handleRouteChange();
  }
  
  /**
   * 处理路由变化
   */
  function handleRouteChange() {
    // 获取当前路径
    const path = window.location.pathname;
    currentPath = path;
    
    // 找到匹配的路由处理程序
    let handler = routes[path];
    
    // 如果没有精确匹配，尝试查找参数化路由
    if (!handler) {
      const paramRoutes = Object.keys(routes).filter(route => route.includes(':'));
      
      for (const paramRoute of paramRoutes) {
        // 转换参数化路由为正则表达式
        const pattern = paramRoute.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(path)) {
          handler = routes[paramRoute];
          break;
        }
      }
    }
    
    // 如果仍未找到处理程序，使用404处理程序
    if (!handler && routes['404']) {
      handler = routes['404'];
    }
    
    // 执行处理程序
    if (handler) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        // 调用处理程序
        try {
          handler(mainContent, extractParams(path));
        } catch (error) {
          console.error('路由处理错误:', error);
          mainContent.innerHTML = `
            <div class="card">
              <h2>发生错误</h2>
              <p>处理此页面时遇到问题: ${error.message}</p>
            </div>
          `;
        }
        
        // 更新导航高亮
        updateNavHighlight(path);
      }
    }
  }
  
  /**
   * 从路径中提取参数
   * @param {string} path - 当前路径
   * @returns {Object} - 参数对象
   */
  function extractParams(path) {
    const params = {};
    
    // 查找匹配的参数化路由
    const paramRoutes = Object.keys(routes).filter(route => route.includes(':'));
    
    for (const paramRoute of paramRoutes) {
      // 创建正则表达式和参数名称数组
      const paramNames = [];
      const patternParts = paramRoute.split('/').map(part => {
        if (part.startsWith(':')) {
          const paramName = part.slice(1);
          paramNames.push(paramName);
          return '([^/]+)';
        }
        return part;
      });
      
      const pattern = `^${patternParts.join('/')}$`;
      const regex = new RegExp(pattern);
      
      // 测试并提取参数
      const match = path.match(regex);
      if (match) {
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        break;
      }
    }
    
    return params;
  }
  
  /**
   * 更新导航高亮
   * @param {string} path - 当前路径
   */
  function updateNavHighlight(path) {
    // 获取所有导航项
    const navItems = document.querySelectorAll('.nav-item, .sidebar-item');
    
    // 移除所有高亮
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // 查找匹配的导航项
    navItems.forEach(item => {
      const itemPath = item.getAttribute('data-path');
      if (itemPath === path || path.startsWith(itemPath + '/')) {
        item.classList.add('active');
      }
    });
  }
  
  /**
   * 初始化路由器
   */
  function init() {
    // 监听浏览器历史变化
    window.addEventListener('popstate', handleRouteChange);
    
    // 劫持链接点击事件
    document.addEventListener('click', (event) => {
      let target = event.target;
      
      // 查找最近的链接元素
      while (target && target !== document) {
        if (target.tagName === 'A' && target.getAttribute('href')) {
          // 检查是否为内部链接
          const href = target.getAttribute('href');
          
          if (href.startsWith('/') && !href.startsWith('//') && !target.getAttribute('target')) {
            // 阻止默认行为
            event.preventDefault();
            
            // 导航到目标路径
            navigate(href);
          }
          
          break;
        }
        
        target = target.parentNode;
      }
    });
    
    // 处理初始路由
    handleRouteChange();
  }
  
  // 公共API
  return {
    registerRoute,
    navigate,
    getCurrentPath,
    init
  };
})(); 