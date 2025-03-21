/**
 * MCP集成SDK API工具
 */

import { ApiResponse, ErrorType, IntegrationError } from '../core/types';

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