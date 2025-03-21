/**
 * MCP集成SDK API工具
 */

import { ApiResponse, ErrorType, IntegrationError } from '../core/types';
import fetch from 'node-fetch';
import { ApiError } from '../errors';
import { logDebug } from './logger';

/**
 * 创建API URL
 * @param baseUrl 基础URL
 * @param path 路径
 * @param params 查询参数
 */
export function createApiUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  const url = new URL(path, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  
  return url.toString();
}

/**
 * 序列化请求体
 * @param body 请求体数据
 */
export function serializeBody(body: any): string | FormData | null {
  if (body == null) {
    return null;
  }
  
  // 如果是FormData，直接返回
  if (body instanceof FormData) {
    return body;
  }
  
  // 如果是字符串，检查是否已经是JSON格式
  if (typeof body === 'string') {
    try {
      // 尝试解析JSON，如果成功，则已经是JSON字符串
      JSON.parse(body);
      return body;
    } catch {
      // 如果解析失败，转换为JSON字符串
      return JSON.stringify({ value: body });
    }
  }
  
  // 其他情况，转换为JSON字符串
  return JSON.stringify(body);
}

/**
 * 从响应中提取数据
 * @param response Fetch响应
 */
export async function extractResponseData<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  
  // 如果是JSON响应
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      throw new IntegrationError(
        '解析JSON响应失败',
        ErrorType.UNKNOWN_ERROR,
        response.status
      );
    }
  }
  
  // 如果是文本响应
  try {
    const text = await response.text();
    return {
      success: response.ok,
      data: text as unknown as T,
    };
  } catch (error) {
    throw new IntegrationError(
      '解析响应失败',
      ErrorType.UNKNOWN_ERROR,
      response.status
    );
  }
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 使用指数退避策略重试请求
 * @param fn 要重试的异步函数
 * @param options 重试选项
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 300,
    maxDelay = 3000,
    factor = 2,
    shouldRetry = () => true
  } = options;
  
  let lastError: any;
  let currentDelay = initialDelay;
  
  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      // 最后一次尝试
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 检查是否应该重试
      if (retryCount >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // 计算下一次延迟
      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * factor, maxDelay);
    }
  }
  
  // 所有重试都失败
  throw lastError;
}

/**
 * API工具函数
 * 用于处理与MCP服务器的API请求
 */

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
    } catch (err) {
      lastError = err as Error;
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