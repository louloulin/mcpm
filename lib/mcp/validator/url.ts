/**
 * URL验证模块
 * 用于验证MCP服务器URL是否有效
 */

import { MCPValidationResult } from '../types';

/**
 * 验证URL是否有效
 * @param url 要验证的URL
 * @returns 验证结果
 */
export function validateUrl(url: string): MCPValidationResult {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('URL不能为空');
    return {
      valid: false,
      errors
    };
  }
  
  try {
    // 尝试解析URL
    const parsedUrl = new URL(url);
    
    // 检查协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push(`不支持的URL协议: ${parsedUrl.protocol}, 只支持http和https`);
    }
    
    // 检查主机名
    if (!parsedUrl.hostname) {
      errors.push('URL缺少主机名');
    }
    
    // 检查是否是IP地址
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsedUrl.hostname);
    const isLocalhost = parsedUrl.hostname === 'localhost';
    
    // 仅在非开发环境下警告使用IP地址或localhost
    if (process.env.NODE_ENV === 'production' && (isIpv4 || isLocalhost)) {
      errors.push(`在生产环境中使用IP地址或localhost不推荐: ${parsedUrl.hostname}`);
    }
    
  } catch (err) {
    errors.push(`无效的URL格式: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 规范化URL
 * @param url 原始URL
 * @returns 规范化后的URL
 */
export function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // 移除尾部斜杠
    if (parsedUrl.pathname.endsWith('/') && parsedUrl.pathname !== '/') {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }
    
    // 确保使用https
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
    }
    
    return parsedUrl.toString();
  } catch {
    // 如果URL无效，直接返回原始URL
    return url;
  }
}

export default {
  validateUrl,
  normalizeUrl
}; 