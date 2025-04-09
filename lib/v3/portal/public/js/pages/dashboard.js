/**
 * MCPM 3.0 开发者门户 - 主仪表板页面
 * 
 * 为用户提供服务概览、性能指标和快速导航入口
 */

import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { formatDate, formatNumber, formatPercent } from '../utils/formatting.js';

// 仪表板页面模块
const DashboardPage = {
  // 初始化
  init: function() {
    // 渲染页面
    this.render();
    
    // 加载数据
    this.loadSummary();
    this.loadRecentActivity();
    
    // 绑定事件
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', this.handleQuickAction.bind(this));
    });
  },
  
  // 渲染页面
  render: function() {
    const mainContent = document.getElementById('main-content');
    
    // 创建页面结构
    mainContent.innerHTML = `
      <div class="dashboard-page">
        <div class="welcome-banner">
          <h1>欢迎使用 MCPM 开发者门户</h1>
          <p>集中管理您的MCP服务、工具和性能指标</p>
        </div>
        
        <!-- 快速操作卡片 -->
        <div class="quick-actions">
          <div class="section-header">
            <h2>快速操作</h2>
          </div>
          <div class="action-cards">
            <div class="action-card">
              <div class="card-icon"><i class="icon-plus"></i></div>
              <h3>创建服务</h3>
              <p>配置和部署新的MCP服务</p>
              <button class="quick-action-btn btn primary" data-action="create-service">开始创建</button>
            </div>
            
            <div class="action-card">
              <div class="card-icon"><i class="icon-tools"></i></div>
              <h3>测试工具</h3>
              <p>在浏览器中直接测试MCP工具</p>
              <button class="quick-action-btn btn secondary" data-action="test-tools">打开测试台</button>
            </div>
            
            <div class="action-card">
              <div class="card-icon"><i class="icon-chart"></i></div>
              <h3>分析仪表板</h3>
              <p>查看详细的性能和使用统计</p>
              <button class="quick-action-btn btn secondary" data-action="open-analytics">查看分析</button>
            </div>
          </div>
        </div>
        
        <!-- 服务概览 -->
        <div class="service-overview">
          <div class="section-header">
            <h2>服务概览</h2>
            <button class="btn-link" id="view-all-services">查看全部</button>
          </div>
          <div class="stats-cards">
            <div class="stat-card" id="total-services">
              <h3>总服务数</h3>
              <div class="stat-value">--</div>
            </div>
            <div class="stat-card" id="active-services">
              <h3>活跃服务</h3>
              <div class="stat-value">--</div>
            </div>
            <div class="stat-card" id="total-tools">
              <h3>注册工具</h3>
              <div class="stat-value">--</div>
            </div>
            <div class="stat-card" id="total-calls">
              <h3>今日调用</h3>
              <div class="stat-value">--</div>
            </div>
          </div>
          
          <div class="services-list" id="services-preview">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <!-- 最近活动 -->
        <div class="recent-activity">
          <div class="section-header">
            <h2>最近活动</h2>
          </div>
          <div class="activity-list" id="activity-list">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
      </div>
    `;
    
    // 绑定查看全部服务按钮
    document.getElementById('view-all-services').addEventListener('click', () => {
      window.location.href = '/services';
    });
  },
  
  // 加载概览数据
  loadSummary: async function() {
    try {
      const summary = await api.get('/api/portal/dashboard/summary');
      
      // 更新统计卡片
      document.querySelector('#total-services .stat-value').textContent = formatNumber(summary.totalServices);
      document.querySelector('#active-services .stat-value').textContent = formatNumber(summary.activeServices);
      document.querySelector('#total-tools .stat-value').textContent = formatNumber(summary.totalTools);
      document.querySelector('#total-calls .stat-value').textContent = formatNumber(summary.todayCalls);
      
      // 更新服务列表
      this.renderServicesPreview(summary.recentServices);
    } catch (error) {
      console.error('加载概览数据失败:', error);
      document.getElementById('services-preview').innerHTML = '<div class="error-message">加载数据失败，请稍后再试</div>';
    }
  },
  
  // 渲染服务预览列表
  renderServicesPreview: function(services) {
    const container = document.getElementById('services-preview');
    
    if (!services || services.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无服务，点击"创建服务"开始使用</div>';
      return;
    }
    
    // 创建服务列表HTML
    let html = '<table class="data-table"><thead><tr><th>服务名称</th><th>状态</th><th>工具数</th><th>最近调用</th><th>操作</th></tr></thead><tbody>';
    
    services.forEach(service => {
      html += `
        <tr>
          <td><a href="/services/${service.id}" class="service-name">${service.name}</a></td>
          <td><span class="status-badge ${service.status}">${service.status === 'active' ? '活跃' : '停用'}</span></td>
          <td>${service.toolCount}</td>
          <td>${service.lastCall ? formatDate(service.lastCall, true) : '从未'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon" data-action="edit" data-id="${service.id}" title="编辑"><i class="icon-edit"></i></button>
              <button class="btn-icon" data-action="view-stats" data-id="${service.id}" title="查看统计"><i class="icon-chart"></i></button>
              <button class="btn-icon" data-action="toggle" data-id="${service.id}" title="${service.status === 'active' ? '停用' : '启用'}">
                <i class="icon-${service.status === 'active' ? 'pause' : 'play'}"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // 绑定操作按钮事件
    container.querySelectorAll('.btn-icon').forEach(btn => {
      btn.addEventListener('click', this.handleServiceAction.bind(this));
    });
  },
  
  // 加载最近活动
  loadRecentActivity: async function() {
    try {
      const activities = await api.get('/api/portal/dashboard/activity');
      
      // 更新活动列表
      this.renderActivityList(activities);
    } catch (error) {
      console.error('加载活动数据失败:', error);
      document.getElementById('activity-list').innerHTML = '<div class="error-message">加载活动失败，请稍后再试</div>';
    }
  },
  
  // 渲染活动列表
  renderActivityList: function(activities) {
    const container = document.getElementById('activity-list');
    
    if (!activities || activities.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无活动记录</div>';
      return;
    }
    
    // 创建活动列表HTML
    let html = '<ul class="timeline">';
    
    activities.forEach(activity => {
      html += `
        <li class="timeline-item ${activity.type}">
          <div class="timeline-badge"><i class="icon-${this.getActivityIcon(activity.type)}"></i></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <strong>${activity.title}</strong>
              <span class="timeline-time">${formatDate(activity.time, true)}</span>
            </div>
            <p>${activity.description}</p>
            ${activity.link ? `<a href="${activity.link}" class="btn-link">查看详情</a>` : ''}
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
  },
  
  // 获取活动图标
  getActivityIcon: function(type) {
    const icons = {
      'create': 'plus',
      'update': 'edit',
      'delete': 'trash',
      'deploy': 'upload',
      'call': 'zap',
      'error': 'alert',
      'login': 'user'
    };
    
    return icons[type] || 'info';
  },
  
  // 处理快速操作
  handleQuickAction: function(event) {
    const action = event.currentTarget.dataset.action;
    
    switch (action) {
      case 'create-service':
        window.location.href = '/services/create';
        break;
        
      case 'test-tools':
        window.location.href = '/tools';
        break;
        
      case 'open-analytics':
        window.location.href = '/analytics';
        break;
        
      default:
        console.warn('未知的快速操作:', action);
    }
  },
  
  // 处理服务操作
  handleServiceAction: function(event) {
    const action = event.currentTarget.dataset.action;
    const serviceId = event.currentTarget.dataset.id;
    
    switch (action) {
      case 'edit':
        window.location.href = `/services/${serviceId}/edit`;
        break;
        
      case 'view-stats':
        window.location.href = `/analytics?service=${serviceId}`;
        break;
        
      case 'toggle':
        this.toggleServiceStatus(serviceId);
        break;
        
      default:
        console.warn('未知的服务操作:', action);
    }
  },
  
  // 切换服务状态
  toggleServiceStatus: async function(serviceId) {
    try {
      // 获取当前状态
      const service = await api.get(`/api/portal/services/${serviceId}`);
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      
      // 更新状态
      await api.put(`/api/portal/services/${serviceId}/status`, { status: newStatus });
      
      // 刷新数据
      this.loadSummary();
      
      // 显示成功消息
      alert(`服务已${newStatus === 'active' ? '启用' : '停用'}`);
    } catch (error) {
      console.error('切换服务状态失败:', error);
      alert('操作失败，请稍后再试');
    }
  }
};

export default DashboardPage; 