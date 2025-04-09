/**
 * MCPM 3.0 开发者门户 - 图表组件
 * 
 * 提供创建各种图表的实用函数，基于Chart.js库
 */

// 默认图表配置
const defaultConfig = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: 'easeOutQuart'
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 10,
      cornerRadius: 4,
      displayColors: true
    }
  }
};

/**
 * 创建折线图
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 图表数据
 * @param {Object} [options] - 额外配置选项
 * @returns {Chart} 图表实例
 */
export function createLineChart(canvas, data, options = {}) {
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js库未加载');
    return null;
  }
  
  // 默认折线图特定配置
  const lineDefaults = {
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 5
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };
  
  // 合并配置
  const chartConfig = {
    type: 'line',
    data: data,
    options: {
      ...defaultConfig,
      ...lineDefaults,
      ...options
    }
  };
  
  // 创建图表
  return new Chart(canvas, chartConfig);
}

/**
 * 创建柱状图
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 图表数据
 * @param {Object} [options] - 额外配置选项
 * @returns {Chart} 图表实例
 */
export function createBarChart(canvas, data, options = {}) {
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js库未加载');
    return null;
  }
  
  // 默认柱状图特定配置
  const barDefaults = {
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    barPercentage: 0.8,
    categoryPercentage: 0.7
  };
  
  // 合并配置
  const chartConfig = {
    type: 'bar',
    data: data,
    options: {
      ...defaultConfig,
      ...barDefaults,
      ...options
    }
  };
  
  // 创建图表
  return new Chart(canvas, chartConfig);
}

/**
 * 创建饼图
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 图表数据
 * @param {Object} [options] - 额外配置选项
 * @returns {Chart} 图表实例
 */
export function createPieChart(canvas, data, options = {}) {
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js库未加载');
    return null;
  }
  
  // 默认饼图特定配置
  const pieDefaults = {
    cutout: '0%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15
        }
      }
    }
  };
  
  // 合并配置
  const chartConfig = {
    type: 'pie',
    data: data,
    options: {
      ...defaultConfig,
      ...pieDefaults,
      ...options
    }
  };
  
  // 创建图表
  return new Chart(canvas, chartConfig);
}

/**
 * 创建环形图
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 图表数据
 * @param {Object} [options] - 额外配置选项
 * @returns {Chart} 图表实例
 */
export function createDoughnutChart(canvas, data, options = {}) {
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js库未加载');
    return null;
  }
  
  // 默认环形图特定配置
  const doughnutDefaults = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15
        }
      }
    }
  };
  
  // 合并配置
  const chartConfig = {
    type: 'doughnut',
    data: data,
    options: {
      ...defaultConfig,
      ...doughnutDefaults,
      ...options
    }
  };
  
  // 创建图表
  return new Chart(canvas, chartConfig);
}

/**
 * 创建雷达图
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 图表数据
 * @param {Object} [options] - 额外配置选项
 * @returns {Chart} 图表实例
 */
export function createRadarChart(canvas, data, options = {}) {
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js库未加载');
    return null;
  }
  
  // 默认雷达图特定配置
  const radarDefaults = {
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          backdropColor: 'transparent',
          showLabelBackdrop: false
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 3,
        hoverRadius: 5
      }
    }
  };
  
  // 合并配置
  const chartConfig = {
    type: 'radar',
    data: data,
    options: {
      ...defaultConfig,
      ...radarDefaults,
      ...options
    }
  };
  
  // 创建图表
  return new Chart(canvas, chartConfig);
}

/**
 * 更新现有图表
 * @param {Chart} chart - 图表实例
 * @param {Object} newData - 新的图表数据
 */
export function updateChart(chart, newData) {
  if (!chart) {
    console.error('图表实例无效');
    return;
  }
  
  // 更新数据集
  if (newData.datasets) {
    chart.data.datasets = newData.datasets;
  }
  
  // 更新标签
  if (newData.labels) {
    chart.data.labels = newData.labels;
  }
  
  // 应用更新并重新渲染
  chart.update();
}

/**
 * 创建实时更新的图表
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {string} type - 图表类型 ('line', 'bar', 'pie', 'doughnut', 'radar')
 * @param {Object} initialData - 初始图表数据
 * @param {Object} options - 配置选项
 * @param {number} refreshInterval - 刷新间隔（毫秒）
 * @param {Function} dataFetcher - 数据获取函数，返回Promise
 * @returns {Object} 图表控制对象
 */
export function createLiveChart(canvas, type, initialData, options, refreshInterval, dataFetcher) {
  let chart;
  let timerId;
  let isRunning = false;
  
  // 根据类型创建图表
  switch (type.toLowerCase()) {
    case 'line':
      chart = createLineChart(canvas, initialData, options);
      break;
    case 'bar':
      chart = createBarChart(canvas, initialData, options);
      break;
    case 'pie':
      chart = createPieChart(canvas, initialData, options);
      break;
    case 'doughnut':
      chart = createDoughnutChart(canvas, initialData, options);
      break;
    case 'radar':
      chart = createRadarChart(canvas, initialData, options);
      break;
    default:
      console.error(`不支持的图表类型: ${type}`);
      return null;
  }
  
  // 更新函数
  const updateData = async () => {
    if (!isRunning) return;
    
    try {
      const newData = await dataFetcher();
      updateChart(chart, newData);
    } catch (error) {
      console.error('获取图表数据失败:', error);
    }
    
    // 安排下一次更新
    timerId = setTimeout(updateData, refreshInterval);
  };
  
  // 控制对象
  const controller = {
    // 启动实时更新
    start: () => {
      if (isRunning) return;
      isRunning = true;
      updateData();
    },
    
    // 停止实时更新
    stop: () => {
      isRunning = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    },
    
    // 手动触发更新
    refresh: () => {
      updateData();
    },
    
    // 获取图表实例
    getChart: () => chart,
    
    // 销毁图表和计时器
    destroy: () => {
      controller.stop();
      if (chart) {
        chart.destroy();
        chart = null;
      }
    }
  };
  
  return controller;
}

// 导出图表工具函数
export default {
  createLineChart,
  createBarChart,
  createPieChart,
  createDoughnutChart,
  createRadarChart,
  updateChart,
  createLiveChart
}; 