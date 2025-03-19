/**
 * 版本验证模块
 * 用于验证MCP服务器版本是否符合语义化版本规范
 */

import { MCPValidationResult } from '../types';
import { parseSemVer } from '../version/semver';

/**
 * 验证版本字符串是否符合语义化版本规范
 * @param version 版本字符串
 * @returns 验证结果
 */
export function validateVersion(version: string): MCPValidationResult {
  const errors: string[] = [];
  
  if (!version) {
    errors.push('版本号不能为空');
    return {
      valid: false,
      errors
    };
  }
  
  // 使用parseSemVer尝试解析版本，如果失败则说明版本格式不正确
  try {
    parseSemVer(version);
  } catch (err) {
    errors.push(`版本格式不正确: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 验证版本范围
 * @param versionRange 版本范围字符串
 * @returns 验证结果
 */
export function validateVersionRange(versionRange: string): MCPValidationResult {
  const errors: string[] = [];
  
  if (!versionRange) {
    errors.push('版本范围不能为空');
    return {
      valid: false,
      errors
    };
  }
  
  // 验证简单的版本范围格式
  // 支持: 精确版本, >=, <=, >, <, ~, ^, 和 范围 (1.0.0 - 2.0.0)
  
  // 精确版本: 1.2.3 或 1.2.3-beta.1
  if (/^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/.test(versionRange)) {
    try {
      parseSemVer(versionRange);
    } catch (err) {
      errors.push(`版本范围格式不正确: ${err instanceof Error ? err.message : String(err)}`);
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // 比较器: >=1.2.3, <=1.2.3, >1.2.3, <1.2.3
  if (/^(>=|<=|>|<)[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/.test(versionRange)) {
    const version = versionRange.substring(
      versionRange.startsWith('>=') || versionRange.startsWith('<=') ? 2 : 1
    );
    try {
      parseSemVer(version);
    } catch (err) {
      errors.push(`版本范围中的版本格式不正确: ${err instanceof Error ? err.message : String(err)}`);
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // 波浪号和插入号: ~1.2.3, ^1.2.3
  if (/^[~^][0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/.test(versionRange)) {
    const version = versionRange.substring(1);
    try {
      parseSemVer(version);
    } catch (err) {
      errors.push(`版本范围中的版本格式不正确: ${err instanceof Error ? err.message : String(err)}`);
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // 范围: 1.2.3 - 2.3.4
  if (versionRange.includes(' - ')) {
    const [minVersion, maxVersion] = versionRange.split(' - ');
    try {
      parseSemVer(minVersion);
    } catch (err) {
      errors.push(`版本范围的最小版本格式不正确: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    try {
      parseSemVer(maxVersion);
    } catch (err) {
      errors.push(`版本范围的最大版本格式不正确: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // 不支持的格式
  errors.push(`不支持的版本范围格式: ${versionRange}`);
  return {
    valid: false,
    errors
  };
}

export default {
  validateVersion,
  validateVersionRange
}; 