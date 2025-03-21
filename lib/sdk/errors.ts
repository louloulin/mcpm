/**
 * 错误类定义
 * 包含SDK使用的自定义错误类型
 */

/**
 * 基础SDK错误类
 * 所有SDK自定义错误的基类
 */
export class MCPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPError';
    
    // 修复TypeScript中继承Error的问题
    Object.setPrototypeOf(this, MCPError.prototype);
  }
}

/**
 * API错误类
 * 表示与API请求相关的错误
 */
export class ApiError extends MCPError {
  readonly statusCode: number;
  readonly data: any;
  
  constructor(message: string, statusCode: number = 0, data: any = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  /**
   * 检查是否为特定HTTP状态码
   */
  isStatus(code: number): boolean {
    return this.statusCode === code;
  }
  
  /**
   * 检查是否为未授权错误
   */
  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }
  
  /**
   * 检查是否为禁止访问错误
   */
  isForbidden(): boolean {
    return this.statusCode === 403;
  }
  
  /**
   * 检查是否为未找到错误
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }
  
  /**
   * 检查是否为服务器错误
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
}

/**
 * 验证错误类
 * 表示验证失败的错误
 */
export class ValidationError extends MCPError {
  readonly errors: Record<string, string[]>;
  
  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 认证错误类
 * 表示认证失败的错误
 */
export class AuthenticationError extends MCPError {
  constructor(message: string = '认证失败') {
    super(message);
    this.name = 'AuthenticationError';
    
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 配置错误类
 * 表示配置无效的错误
 */
export class ConfigurationError extends MCPError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * 超时错误类
 * 表示操作超时的错误
 */
export class TimeoutError extends MCPError {
  readonly operationName: string;
  readonly timeoutMs: number;
  
  constructor(operationName: string, timeoutMs: number) {
    super(`操作 "${operationName}" 在 ${timeoutMs}ms 后超时`);
    this.name = 'TimeoutError';
    this.operationName = operationName;
    this.timeoutMs = timeoutMs;
    
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * 未找到资源错误类
 * 表示请求的资源未找到
 */
export class ResourceNotFoundError extends MCPError {
  readonly resourceType: string;
  readonly resourceId: string;
  
  constructor(resourceType: string, resourceId: string) {
    super(`未找到资源: ${resourceType} (ID: ${resourceId})`);
    this.name = 'ResourceNotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

/**
 * 重试失败错误类
 * 表示重试操作后仍然失败
 */
export class RetryFailedError extends MCPError {
  readonly attempts: number;
  readonly originalError: Error | null;
  
  constructor(message: string, attempts: number, originalError: Error | null = null) {
    super(message);
    this.name = 'RetryFailedError';
    this.attempts = attempts;
    this.originalError = originalError;
    
    Object.setPrototypeOf(this, RetryFailedError.prototype);
  }
} 