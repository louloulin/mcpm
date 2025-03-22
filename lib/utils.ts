import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化为相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffMonth / 12);

  if (diffSec < 60) {
    return `${diffSec}秒前`;
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  } else {
    return `${diffYear}年前`;
  }
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("zh-CN").format(num);
}

/**
 * 限制字符串长度并添加省略号
 */
export function truncateString(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

/**
 * 安全地从对象中获取嵌套属性
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[key];
  }

  return current === undefined ? defaultValue : current;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 将字符串转换为友好的URL slug
 * @param str 要转换的字符串
 * @returns 生成的slug
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除非单词/空格/连字符的字符
    .replace(/[\s_-]+/g, '-') // 将空格、下划线和连字符替换为单个连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}

/**
 * 将字节数转换为可读大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 可读大小字符串，如 '1.5 MB'
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 截断文本并添加省略号
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * 比较两个版本号
 * @param version1 版本号1
 * @param version2 版本号2
 * @returns 如果version1 > version2返回1，如果version1 < version2返回-1，相等返回0
 */
export function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * 从错误对象或字符串中获取错误消息
 * @param error 错误对象或字符串
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * 生成随机ID
 * @param length ID长度，默认8
 * @returns 随机ID字符串
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
