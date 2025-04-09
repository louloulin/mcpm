/**
 * MCPM 开发者门户 导航组件
 * 
 * 管理导航栏和侧边栏
 */

const Navigation = (function() {
  /**
   * 主要导航项
   */
  const mainNavItems = [
    {
      text: '服务管理',
      path: '/services',
      icon: 'fas fa-server',
      requiredRole: null
    },
    {
      text: '工具测试',
      path: '/tools',
      icon: 'fas fa-tools',
      requiredRole: null
    },
    {
      text: '分析统计',
      path: '/analytics',
      icon: 'fas fa-chart-bar',
      requiredRole: null
    }
  ];
  
  /**
   * 侧边栏导航项分组
   */
  const sidebarNavGroups = [
    {
      title: '主要功能',
      items: [
        {
          text: '仪表盘',
          path: '/',
          icon: 'fas fa-home',
          requiredRole: null
        },
        {
          text: '服务管理',
          path: '/services',
          icon: 'fas fa-server',
          requiredRole: null
        },
        {
          text: '工具测试',
          path: '/tools',
          icon: 'fas fa-tools',
          requiredRole: null
        }
      ]
    },
    {
      title: '监控与分析',
      items: [
        {
          text: '使用统计',
          path: '/analytics',
          icon: 'fas fa-chart-line',
          requiredRole: null
        },
        {
          text: '服务健康状态',
          path: '/analytics/health',
          icon: 'fas fa-heartbeat',
          requiredRole: 'admin'
        },
        {
          text: '性能分析',
          path: '/analytics/performance',
          icon: 'fas fa-tachometer-alt',
          requiredRole: 'admin'
        }
      ]
    },
    {
      title: '系统管理',
      items: [
        {
          text: '用户管理',
          path: '/admin/users',
          icon: 'fas fa-users',
          requiredRole: 'admin'
        },
        {
          text: '系统设置',
          path: '/admin/settings',
          icon: 'fas fa-cog',
          requiredRole: 'admin'
        }
      ]
    }
  ];
  
  /**
   * 初始化导航
   */
  function init() {
    initMainNav();
    initSidebar();
  }
  
  /**
   * 初始化主导航
   */
  function initMainNav() {
    const mainNav = document.getElementById('main-nav');
    if (!mainNav) return;
    
    // 清空现有导航
    mainNav.innerHTML = '';
    
    // 仅显示当前用户有权限访问的导航项
    const visibleItems = mainNavItems.filter(item => {
      return !item.requiredRole || Auth.hasRole(item.requiredRole);
    });
    
    // 创建导航项
    visibleItems.forEach(item => {
      const navItem = document.createElement('a');
      navItem.className = 'nav-item';
      navItem.href = item.path;
      navItem.textContent = item.text;
      navItem.setAttribute('data-path', item.path);
      
      mainNav.appendChild(navItem);
    });
  }
  
  /**
   * 初始化侧边栏
   */
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // 清空现有内容
    sidebar.innerHTML = '';
    
    // 创建侧边栏内容
    sidebarNavGroups.forEach(group => {
      // 过滤当前用户有权限访问的导航项
      const visibleItems = group.items.filter(item => {
        return !item.requiredRole || Auth.hasRole(item.requiredRole);
      });
      
      // 如果没有可见项，跳过整个分组
      if (visibleItems.length === 0) return;
      
      // 添加分组标题
      const sectionTitle = document.createElement('div');
      sectionTitle.className = 'sidebar-section-title';
      sectionTitle.textContent = group.title;
      sidebar.appendChild(sectionTitle);
      
      // 创建导航列表
      const navList = document.createElement('ul');
      navList.className = 'sidebar-menu';
      
      // 添加导航项
      visibleItems.forEach(item => {
        const listItem = document.createElement('li');
        
        const navItem = document.createElement('a');
        navItem.className = 'sidebar-item';
        navItem.href = item.path;
        navItem.setAttribute('data-path', item.path);
        
        // 添加图标
        if (item.icon) {
          const icon = document.createElement('i');
          icon.className = item.icon;
          navItem.appendChild(icon);
        }
        
        // 添加文本
        const text = document.createElement('span');
        text.textContent = item.text;
        navItem.appendChild(text);
        
        listItem.appendChild(navItem);
        navList.appendChild(listItem);
      });
      
      sidebar.appendChild(navList);
    });
  }
  
  /**
   * 更新导航（用于权限变更时）
   */
  function update() {
    init();
  }
  
  // 公共API
  return {
    init,
    update
  };
})(); 