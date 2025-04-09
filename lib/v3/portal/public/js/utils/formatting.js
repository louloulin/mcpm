/**
 * MCPM 3.0 开发者门户 - 格式化工具函数
 * 
 * 提供各种数据格式化和显示辅助函数
 */

/**
 * 格式化数字，添加千位分隔符
 * @param {number} num - 要格式化的数字
 * @param {number} [decimals=0] - 小数位数
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) {
    return '--';
  }
  
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期对象或日期字符串
 * @param {boolean} [includeTime=false] - 是否包含时间
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, includeTime = false) {
  if (!date) {
    return '--';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '--';
  }
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }
  
  return new Intl.DateTimeFormat('zh-CN', options).format(dateObj);
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @param {number} [decimals=2] - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '--';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间（毫秒）
 * @param {number} ms - 毫秒数
 * @param {boolean} [showMilliseconds=true] - 是否显示毫秒
 * @returns {string} 格式化后的持续时间
 */
export function formatDuration(ms, showMilliseconds = true) {
  if (ms === null || ms === undefined) {
    return '--';
  }
  
  if (ms < 1000 && showMilliseconds) {
    return `${ms.toFixed(0)} ms`;
  }
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days}d`);
  }
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (seconds > 0 || parts.length === 0) {
    if (showMilliseconds && ms >= 1000 && ms % 1000 !== 0) {
      parts.push(`${seconds}.${Math.floor((ms % 1000) / 10)}s`);
    } else {
      parts.push(`${seconds}s`);
    }
  }
  
  return parts.join(' ');
}

/**
 * 格式化百分比
 * @param {number} value - 百分比值（0-1）
 * @param {number} [decimals=2] - 小数位数
 * @returns {string} 格式化后的百分比
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) {
    return '--';
  }
  
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 截断文本
 * @param {string} text - 文本内容
 * @param {number} [maxLength=50] - 最大长度
 * @param {string} [ellipsis='...'] - 省略符
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 50, ellipsis = '...') {
  if (!text) {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + ellipsis;
}

/**
 * 格式化JSON为缩进的字符串
 * @param {object} obj - 要格式化的对象
 * @param {number} [spaces=2] - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJSON(obj, spaces = 2) {
  try {
    return JSON.stringify(obj, null, spaces);
  } catch (error) {
    return '无效的JSON数据';
  }
}

/**
 * 格式化状态为可读文本
 * @param {string} status - 状态码
 * @param {object} [statusMap] - 状态映射对象
 * @returns {string} 格式化后的状态文本
 */
export function formatStatus(status, statusMap = {}) {
  const defaultStatusMap = {
    'active': '活跃',
    'inactive': '不活跃',
    'pending': '待处理',
    'completed': '已完成',
    'failed': '失败',
    'error': '错误',
    'success': '成功',
    'warning': '警告',
    'info': '信息'
  };
  
  const mergedMap = { ...defaultStatusMap, ...statusMap };
  
  return mergedMap[status] || status;
}

/**
 * 格式化相对时间（例如"3分钟前"）
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date) {
  if (!date) {
    return '--';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '--';
  }
  
  const now = new Date();
  const diff = now - dateObj;
  const diffSeconds = Math.floor(diff / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds} 秒前`;
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} 天前`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} 个月前`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} 年前`;
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} [currency='CNY'] - 货币代码
 * @returns {string} 格式化后的货币
 */
export function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined) {
    return '--';
  }
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// 导出所有格式化工具函数
export default {
  formatNumber,
  formatDate,
  formatFileSize,
  formatDuration,
  formatPercent,
  truncateText,
  formatJSON,
  formatStatus,
  formatRelativeTime,
  formatCurrency
}; 