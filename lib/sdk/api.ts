/**
 * API工具函数
 * 用于处理与MCP服务器的API请求
 */

import fetch from 'node-fetch';
import { ApiError } from './errors';
import { logDebug } from './utils/logger';

/**
 * HTTP请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 请求选项接口
 */
export interface RequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * 默认请求选项
 */
const DEFAULT_OPTIONS: Partial<RequestOptions> = {
  timeout: 30000, // 30秒超时
  retries: 3,     // 默认重试3次
  retryDelay: 500 // 重试间隔500ms
};

/**
 * 发送API请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns 响应数据
 * @throws ApiError 当请求失败时
 */
export async function makeRequest<T = any>(url: string, options: RequestOptions): Promise<T> {
  const requestOptions: RequestOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  const { method, headers = {}, body, timeout, retries, retryDelay } = requestOptions;
  let attempts = 0;
  let lastError: Error | null = null;
  
  // 添加内容类型头（如果未指定且有请求体）
  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // 准备fetch选项
  const fetchOptions: any = {
    method,
    headers,
    timeout
  };
  
  // 添加请求体（如果有）
  if (body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  // 重试逻辑
  while (attempts < (retries || 1)) {
    try {
      logDebug(`Making ${method} request to ${url} [Attempt ${attempts + 1}/${retries}]`);
      
      // 发送请求
      const response = await fetch(url, fetchOptions);
      
      // 检查响应状态
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // 忽略JSON解析错误
        }
        
        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }
      
      // 解析JSON响应
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        return await response.json() as T;
      }
      
      // 返回文本响应
      return await response.text() as unknown as T;
    } catch (error) {
      lastError = error as Error;
      attempts++;
      
      // 如果达到最大重试次数，抛出错误
      if (attempts >= (retries || 1)) {
        break;
      }
      
      // 等待重试延迟时间
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // 所有重试都失败，抛出最后一个错误
  if (lastError instanceof ApiError) {
    throw lastError;
  } else {
    throw new ApiError(
      lastError?.message || 'Request failed',
      0,
      { originalError: lastError }
    );
  }
}

/**
 * 构建完整URL（处理相对路径）
 * @param baseUrl 基础URL
 * @param path 路径
 * @returns 完整URL
 */
export function buildUrl(baseUrl: string, path: string): string {
  // 移除baseUrl结尾的斜杠（如果有）
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // 确保path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${normalizedPath}`;
}

/**
 * GET请求快捷方法
 * @param url 请求URL
 * @param headers 请求头
 * @returns 响应数据
 */
export async function get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
  return makeRequest<T>(url, {
    method: 'GET',
    headers
  });
}

/**
 * POST请求快捷方法
 * @param url 请求URL
 * @param body 请求体
 * @param headers 请求头
 * @returns 响应数据
 */
export async function post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
  return makeRequest<T>(url, {
    method: 'POST',
    body,
    headers
  });
}

/**
 * PUT请求快捷方法
 * @param url 请求URL
 * @param body 请求体
 * @param headers 请求头
 * @returns 响应数据
 */
export async function put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
  return makeRequest<T>(url, {
    method: 'PUT',
    body,
    headers
  });
}

/**
 * DELETE请求快捷方法
 * @param url 请求URL
 * @param headers 请求头
 * @returns 响应数据
 */
export async function del<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
  return makeRequest<T>(url, {
    method: 'DELETE',
    headers
  });
}

/**
 * PATCH请求快捷方法
 * @param url 请求URL
 * @param body 请求体
 * @param headers 请求头
 * @returns 响应数据
 */
export async function patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
  return makeRequest<T>(url, {
    method: 'PATCH',
    body,
    headers
  });
} 