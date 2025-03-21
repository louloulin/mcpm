/**
 * 身份验证工具函数
 * 提供API认证和令牌处理相关功能
 */

import { AuthenticationError } from '../errors';

/**
 * 生成认证请求头
 * @param apiKey API密钥
 * @returns 包含Authorization头的对象
 */
export function createAuthHeaders(apiKey?: string): Record<string, string> {
  if (!apiKey) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${apiKey}`
  };
}

/**
 * 验证API密钥格式
 * @param apiKey 要验证的API密钥
 * @throws {AuthenticationError} 当API密钥格式无效时
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new AuthenticationError('API密钥不能为空');
  }
  
  if (!apiKey.startsWith('mcp_')) {
    throw new AuthenticationError('API密钥格式无效，必须以"mcp_"开头');
  }
  
  // 去掉前缀后检查长度
  const keyPart = apiKey.substring(4);
  if (keyPart.length < 10) {
    throw new AuthenticationError('密钥长度无效，至少应包含10个字符');
  }
}

/**
 * JWT令牌负载类型
 */
export interface TokenPayload {
  [key: string]: any;
}

/**
 * 解析JWT令牌
 * @param token JWT令牌
 * @returns 令牌负载
 * @throws {AuthenticationError} 当令牌格式无效时
 */
export function parseToken(token: string): TokenPayload {
  if (!token) {
    throw new AuthenticationError('令牌不能为空');
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('令牌格式无效');
  }
  
  try {
    // 解码Base64URL编码的负载部分
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    
    return JSON.parse(decoded);
  } catch {
    throw new AuthenticationError('无法解析令牌负载');
  }
}

/**
 * 验证认证头格式
 * @param authHeader 认证头值
 * @returns 提取的令牌
 * @throws {AuthenticationError} 当认证头格式无效时
 */
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new AuthenticationError('认证头不能为空');
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthenticationError('认证头格式无效，必须使用Bearer方案');
  }
  
  return parts[1];
}

/**
 * 生成API密钥
 * @param type 密钥类型（test/live）
 * @returns 生成的API密钥
 */
export function generateApiKey(type: 'test' | 'live' = 'test'): string {
  const prefix = `mcp_${type}_`;
  const randomBytes = Buffer.from(Math.random().toString(36).substring(2));
  const key = randomBytes.toString('hex').substring(0, 24);
  
  return `${prefix}${key}`;
}

/**
 * 混淆API密钥用于显示
 * 隐藏中间部分，保留前缀和后四个字符
 * @param apiKey API密钥
 * @returns 混淆后的API密钥
 */
export function obfuscateApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return apiKey;
  }
  
  const prefixEnd = apiKey.indexOf('_', 4) !== -1 ? apiKey.indexOf('_', 4) + 1 : 4;
  const prefix = apiKey.substring(0, prefixEnd);
  const suffix = apiKey.substring(apiKey.length - 4);
  
  return `${prefix}${'*'.repeat(6)}${suffix}`;
} 