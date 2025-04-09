/**
 * MCPM 3.0 开发者门户 - 分析仪表板页面
 * 
 * 用于展示服务使用情况、性能指标和工具调用统计的分析仪表板
 */

import { api } from '../core/api.js';
import { auth } from '../core/auth.js';
import { formatDate, formatNumber } from '../utils/formatting.js';
import { createLineChart, createBarChart, createPieChart } from '../components/charts.js';

// 分析页面模块
const AnalyticsPage = {
  // 当前选中的服务ID
  currentServiceId: null,
  
  // 日期范围
  dateRange: 'last7',
  
  // 图表实例
  charts: {},
  
  // 初始化
  init: function() {
    // 检查用户权限
    if (!auth.hasPermission('VIEW_ANALYTICS')) {
      window.location.href = '/dashboard';
      return;
    }
    
    // 渲染页面
    this.render();
    
    // 绑定事件
    document.getElementById('service-selector').addEventListener('change', this.onServiceChange.bind(this));
    document.getElementById('date-range').addEventListener('change', this.onDateRangeChange.bind(this));
    document.getElementById('refresh-btn').addEventListener('click', this.loadData.bind(this));
    
    // 加载服务列表
    this.loadServices();
  },
  
  // 渲染页面
  render: function() {
    const mainContent = document.getElementById('main-content');
    
    // 创建页面结构
    mainContent.innerHTML = `
      <div class="analytics-page">
        <div class="page-header">
          <h1>分析仪表板</h1>
          <div class="filters">
            <div class="filter-group">
              <label for="service-selector">服务:</label>
              <select id="service-selector">
                <option value="all">所有服务</option>
                <!-- 服务列表将动态加载 -->
              </select>
            </div>
            <div class="filter-group">
              <label for="date-range">时间范围:</label>
              <select id="date-range">
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="last7" selected>最近7天</option>
                <option value="last30">最近30天</option>
                <option value="last90">最近90天</option>
                <option value="custom">自定义范围</option>
              </select>
            </div>
            <button id="refresh-btn" class="btn primary">刷新</button>
          </div>
        </div>
        
        <!-- 概况卡片 -->
        <div class="stats-cards">
          <div class="stat-card" id="total-requests">
            <h3>总请求数</h3>
            <div class="stat-value">--</div>
            <div class="stat-change">--</div>
          </div>
          <div class="stat-card" id="avg-latency">
            <h3>平均延迟</h3>
            <div class="stat-value">--</div>
            <div class="stat-change">--</div>
          </div>
          <div class="stat-card" id="success-rate">
            <h3>成功率</h3>
            <div class="stat-value">--</div>
            <div class="stat-change">--</div>
          </div>
          <div class="stat-card" id="active-clients">
            <h3>活跃客户端</h3>
            <div class="stat-value">--</div>
            <div class="stat-change">--</div>
          </div>
        </div>
        
        <!-- 图表区域 -->
        <div class="charts-container">
          <div class="chart-row">
            <div class="chart-container">
              <h3>请求趋势</h3>
              <canvas id="requests-chart"></canvas>
            </div>
            <div class="chart-container">
              <h3>延迟分布</h3>
              <canvas id="latency-chart"></canvas>
            </div>
          </div>
          <div class="chart-row">
            <div class="chart-container">
              <h3>热门工具</h3>
              <canvas id="tools-chart"></canvas>
            </div>
            <div class="chart-container">
              <h3>错误分布</h3>
              <canvas id="errors-chart"></canvas>
            </div>
          </div>
        </div>
        
        <!-- 详细数据表格 -->
        <div class="data-table-section">
          <h3>详细数据</h3>
          <table class="data-table" id="detailed-data">
            <thead>
              <tr>
                <th>时间</th>
                <th>工具</th>
                <th>调用次数</th>
                <th>平均延迟</th>
                <th>成功率</th>
              </tr>
            </thead>
            <tbody>
              <!-- 数据将动态加载 -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  // 加载服务列表
  loadServices: async function() {
    try {
      const services = await api.get('/api/portal/services');
      const selector = document.getElementById('service-selector');
      
      // 添加服务选项
      services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.name;
        selector.appendChild(option);
      });
      
      // 加载初始数据
      this.loadData();
    } catch (error) {
      console.error('加载服务列表失败:', error);
      alert('无法加载服务列表。请稍后再试。');
    }
  },
  
  // 加载分析数据
  loadData: async function() {
    const serviceId = document.getElementById('service-selector').value;
    const dateRange = this.dateRange;
    
    try {
      // 显示加载中状态
      this.showLoading(true);
      
      // 获取日期范围参数
      const dateParams = this.getDateRangeParams(dateRange);
      
      // 加载概况数据
      const overview = await api.get('/api/portal/analytics/overview', {
        serviceId: serviceId === 'all' ? null : serviceId,
        ...dateParams
      });
      
      // 加载详细数据
      const details = await api.get('/api/portal/analytics/details', {
        serviceId: serviceId === 'all' ? null : serviceId,
        ...dateParams
      });
      
      // 更新UI
      this.updateOverview(overview);
      this.updateCharts(details);
      this.updateDetailTable(details);
      
      // 保存当前服务ID
      this.currentServiceId = serviceId;
    } catch (error) {
      console.error('加载分析数据失败:', error);
      alert('无法加载分析数据。请稍后再试。');
    } finally {
      // 隐藏加载中状态
      this.showLoading(false);
    }
  },
  
  // 更新概况数据
  updateOverview: function(data) {
    // 更新总请求数
    const totalRequests = document.getElementById('total-requests');
    totalRequests.querySelector('.stat-value').textContent = formatNumber(data.totalRequests);
    totalRequests.querySelector('.stat-change').textContent = this.formatChange(data.totalRequestsChange);
    totalRequests.querySelector('.stat-change').className = 'stat-change ' + (data.totalRequestsChange >= 0 ? 'positive' : 'negative');
    
    // 更新平均延迟
    const avgLatency = document.getElementById('avg-latency');
    avgLatency.querySelector('.stat-value').textContent = `${data.avgLatency.toFixed(2)} ms`;
    avgLatency.querySelector('.stat-change').textContent = this.formatChange(data.avgLatencyChange * -1); // 延迟下降是积极的变化
    avgLatency.querySelector('.stat-change').className = 'stat-change ' + (data.avgLatencyChange <= 0 ? 'positive' : 'negative');
    
    // 更新成功率
    const successRate = document.getElementById('success-rate');
    successRate.querySelector('.stat-value').textContent = `${(data.successRate * 100).toFixed(2)}%`;
    successRate.querySelector('.stat-change').textContent = this.formatChange(data.successRateChange);
    successRate.querySelector('.stat-change').className = 'stat-change ' + (data.successRateChange >= 0 ? 'positive' : 'negative');
    
    // 更新活跃客户端
    const activeClients = document.getElementById('active-clients');
    activeClients.querySelector('.stat-value').textContent = formatNumber(data.activeClients);
    activeClients.querySelector('.stat-change').textContent = this.formatChange(data.activeClientsChange);
    activeClients.querySelector('.stat-change').className = 'stat-change ' + (data.activeClientsChange >= 0 ? 'positive' : 'negative');
  },
  
  // 更新图表
  updateCharts: function(data) {
    // 请求趋势图表
    this.updateRequestsChart(data.timeSeries);
    
    // 延迟分布图表
    this.updateLatencyChart(data.latencyDistribution);
    
    // 热门工具图表
    this.updateToolsChart(data.topTools);
    
    // 错误分布图表
    this.updateErrorsChart(data.errorTypes);
  },
  
  // 更新请求趋势图表
  updateRequestsChart: function(timeSeries) {
    const canvas = document.getElementById('requests-chart');
    
    if (this.charts.requests) {
      this.charts.requests.destroy();
    }
    
    const labels = timeSeries.map(item => formatDate(item.date));
    const successData = timeSeries.map(item => item.successCount);
    const failureData = timeSeries.map(item => item.failureCount);
    
    this.charts.requests = createLineChart(canvas, {
      labels: labels,
      datasets: [
        {
          label: '成功请求',
          data: successData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)'
        },
        {
          label: '失败请求',
          data: failureData,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.2)'
        }
      ]
    });
  },
  
  // 更新延迟分布图表
  updateLatencyChart: function(latencyDistribution) {
    const canvas = document.getElementById('latency-chart');
    
    if (this.charts.latency) {
      this.charts.latency.destroy();
    }
    
    const labels = latencyDistribution.map(item => `${item.min}-${item.max} ms`);
    const data = latencyDistribution.map(item => item.count);
    
    this.charts.latency = createBarChart(canvas, {
      labels: labels,
      datasets: [
        {
          label: '请求数',
          data: data,
          backgroundColor: 'rgba(33, 150, 243, 0.7)'
        }
      ]
    });
  },
  
  // 更新热门工具图表
  updateToolsChart: function(topTools) {
    const canvas = document.getElementById('tools-chart');
    
    if (this.charts.tools) {
      this.charts.tools.destroy();
    }
    
    const labels = topTools.map(item => item.toolName);
    const data = topTools.map(item => item.callCount);
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(233, 30, 99, 0.7)',
      'rgba(0, 188, 212, 0.7)'
    ];
    
    this.charts.tools = createPieChart(canvas, {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors
        }
      ]
    });
  },
  
  // 更新错误分布图表
  updateErrorsChart: function(errorTypes) {
    const canvas = document.getElementById('errors-chart');
    
    if (this.charts.errors) {
      this.charts.errors.destroy();
    }
    
    const labels = errorTypes.map(item => item.errorType);
    const data = errorTypes.map(item => item.count);
    const backgroundColors = [
      'rgba(244, 67, 54, 0.7)',
      'rgba(255, 152, 0, 0.7)',
      'rgba(255, 87, 34, 0.7)',
      'rgba(121, 85, 72, 0.7)',
      'rgba(158, 158, 158, 0.7)'
    ];
    
    this.charts.errors = createPieChart(canvas, {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors
        }
      ]
    });
  },
  
  // 更新详细数据表格
  updateDetailTable: function(data) {
    const tbody = document.querySelector('#detailed-data tbody');
    tbody.innerHTML = '';
    
    // 组合数据
    const tableData = [];
    data.timeSeries.forEach(timePoint => {
      data.topTools.forEach(tool => {
        // 在真实实现中，这里应该使用实际的每个工具每个时间点的数据
        // 这里简化处理，使用随机数据
        const toolData = {
          date: timePoint.date,
          toolName: tool.toolName,
          callCount: Math.floor(Math.random() * 100),
          avgLatency: Math.floor(Math.random() * 200),
          successRate: 0.85 + Math.random() * 0.15
        };
        tableData.push(toolData);
      });
    });
    
    // 按时间逆序排序
    tableData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 只显示前20条
    const displayData = tableData.slice(0, 20);
    
    // 添加到表格
    displayData.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(item.date)}</td>
        <td>${item.toolName}</td>
        <td>${item.callCount}</td>
        <td>${item.avgLatency.toFixed(2)} ms</td>
        <td>${(item.successRate * 100).toFixed(2)}%</td>
      `;
      tbody.appendChild(row);
    });
  },
  
  // 处理服务选择改变事件
  onServiceChange: function(event) {
    this.loadData();
  },
  
  // 处理日期范围改变事件
  onDateRangeChange: function(event) {
    const value = event.target.value;
    this.dateRange = value;
    
    if (value === 'custom') {
      // 显示日期选择器（在实际实现中处理）
      alert('自定义日期范围功能尚未实现');
      event.target.value = 'last7';
      this.dateRange = 'last7';
    }
    
    this.loadData();
  },
  
  // 获取日期范围参数
  getDateRangeParams: function(rangeType) {
    const now = new Date();
    let startDate, endDate;
    
    switch (rangeType) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'last7':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDate = now;
        break;
      case 'last30':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        endDate = now;
        break;
      case 'last90':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDate = now;
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  },
  
  // 格式化变化值
  formatChange: function(value) {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  },
  
  // 显示/隐藏加载状态
  showLoading: function(show) {
    // 在实际实现中，这里可以显示/隐藏加载指示器
    const charts = document.querySelectorAll('.chart-container');
    charts.forEach(chart => {
      chart.style.opacity = show ? '0.5' : '1';
    });
    
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
      card.style.opacity = show ? '0.5' : '1';
    });
  }
};

export default AnalyticsPage; 