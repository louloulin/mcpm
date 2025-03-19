/**
 * MCP规范验证器
 * 用于验证MCP服务器定义是否符合规范
 */

import { MCPServerDefinition, MCPValidationResult } from '../types';
import { validateSchema } from './schema';
import { validateVersion } from './version';
import { validateUrl } from './url';

/**
 * 验证MCP服务器定义
 * @param serverDef 服务器定义
 * @returns 验证结果
 */
export function validateMCPServerDefinition(serverDef: MCPServerDefinition): MCPValidationResult {
  const errors: string[] = [];
  
  // 验证基础字段
  if (!serverDef.name) {
    errors.push('服务器名称(name)不能为空');
  } else if (!/^[a-z0-9_-]+$/.test(serverDef.name)) {
    errors.push('服务器名称(name)只能包含小写字母、数字、下划线和连字符');
  }
  
  // 验证版本号格式
  const versionResult = validateVersion(serverDef.version);
  if (!versionResult.valid) {
    errors.push(...(versionResult.errors || []));
  }
  
  // 验证URL格式
  if (serverDef.url) {
    const urlResult = validateUrl(serverDef.url);
    if (!urlResult.valid) {
      errors.push(...(urlResult.errors || []));
    }
  } else {
    errors.push('服务器URL(url)不能为空');
  }
  
  // 验证JSON Schema
  const schemaResult = validateSchema(serverDef);
  if (!schemaResult.valid) {
    errors.push(...(schemaResult.errors || []));
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 规格化MCP服务器定义
 * 补充默认值，保证格式一致性
 * @param serverDef 原始服务器定义
 * @returns 规格化后的服务器定义
 */
export function normalizeMCPServerDefinition(serverDef: MCPServerDefinition): MCPServerDefinition {
  const now = new Date().toISOString();
  
  // 创建一个新对象，避免修改原始对象
  return {
    ...serverDef,
    // 确保创建时间存在
    createdAt: serverDef.createdAt || now,
    // 更新时间总是当前时间
    updatedAt: now,
    // 确保标签为数组
    tags: serverDef.tags || [],
    // 如果依赖为空，提供空对象
    dependencies: serverDef.dependencies || {}
  };
}

export default {
  validateMCPServerDefinition,
  normalizeMCPServerDefinition
}; 