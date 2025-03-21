/**
 * 日志工具函数
 * 为SDK提供日志记录功能
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /**
   * 最低日志级别
   * 低于此级别的日志将不会被输出
   */
  minLevel: LogLevel;
  
  /**
   * 是否在控制台输出
   */
  console: boolean;
  
  /**
   * 自定义日志处理函数
   */
  customHandler?: (level: LogLevel, message: string, data?: any) => void;
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  console: true
};

// 当前日志配置
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * 配置日志系统
 * @param config 日志配置
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config
  };
}

/**
 * 获取日志级别名称
 * @param level 日志级别
 * @returns 日志级别名称
 */
function getLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * 记录日志的核心函数
 * @param level 日志级别
 * @param message 日志消息
 * @param data 附加数据
 */
function log(level: LogLevel, message: string, data?: any): void {
  // 如果日志级别低于配置的最低级别，不记录
  if (level < currentConfig.minLevel) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[MCP-SDK][${timestamp}][${getLevelName(level)}]`;
  const formattedMessage = `${prefix} ${message}`;
  
  // 在控制台输出
  if (currentConfig.console) {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
    }
  }
  
  // 使用自定义处理函数（如果有）
  if (currentConfig.customHandler) {
    try {
      currentConfig.customHandler(level, message, data);
    } catch (error) {
      // 忽略自定义处理函数中的错误
      console.error(`[MCP-SDK][Logger] Error in custom log handler: ${error}`);
    }
  }
}

/**
 * 记录调试级别日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logDebug(message: string, data?: any): void {
  log(LogLevel.DEBUG, message, data);
}

/**
 * 记录信息级别日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logInfo(message: string, data?: any): void {
  log(LogLevel.INFO, message, data);
}

/**
 * 记录警告级别日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logWarn(message: string, data?: any): void {
  log(LogLevel.WARN, message, data);
}

/**
 * 记录错误级别日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logError(message: string, data?: any): void {
  log(LogLevel.ERROR, message, data);
}

/**
 * 创建命名空间的记录器
 * @param namespace 命名空间
 * @returns 具有指定命名空间的记录器函数集合
 */
export function createNamedLogger(namespace: string) {
  return {
    debug: (message: string, data?: any) => logDebug(`[${namespace}] ${message}`, data),
    info: (message: string, data?: any) => logInfo(`[${namespace}] ${message}`, data),
    warn: (message: string, data?: any) => logWarn(`[${namespace}] ${message}`, data),
    error: (message: string, data?: any) => logError(`[${namespace}] ${message}`, data)
  };
} 