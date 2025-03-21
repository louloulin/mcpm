/**
 * MCP集成SDK类型定义
 */
import { IntegrationType } from '../../api/services/IntegrationService';

/**
 * 集成客户端配置
 */
export interface IntegrationClientConfig {
  serverUrl: string;
  apiKey?: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * SDK初始化选项
 */
export interface IntegrationClientOptions {
  baseUrl: string;
  apiKey: string;
  type: IntegrationType;
  timeout?: number;
  debug?: boolean;
}

/**
 * 服务器信息
 */
export interface ServerInfo {
  id: string;
  name: string;
  key: string;
  description?: string;
  version: string;
  tools?: any[];
  metadata?: Record<string, any>;
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * 集成SDK错误
 */
export class IntegrationError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: any;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN_ERROR, statusCode?: number, details?: any) {
    super(message);
    this.name = 'IntegrationError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 事件类型
 */
export enum EventType {
  SERVER_UPDATED = 'server.updated',
  SERVER_DEPLOYED = 'server.deployed',
  SERVER_DELETED = 'server.deleted',
  INTEGRATION_CREATED = 'integration.created',
  INTEGRATION_UPDATED = 'integration.updated',
  INTEGRATION_DELETED = 'integration.deleted'
}

/**
 * 事件处理器
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * 认证选项
 */
export interface AuthOptions {
  apiKey: string;
  email?: string;
  password?: string;
  token?: string;
  refreshToken?: string;
} 