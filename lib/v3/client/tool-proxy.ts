/**
 * MCPM 3.0 工具代理
 * 提供动态工具访问机制
 */

import { MCPTool } from '../../mcp/types';
import { ServiceMetadata, ToolCallResult, ToolProxy } from './types';

/**
 * 创建工具代理
 * 允许使用链式调用方式动态访问服务工具
 * 
 * @param fetchMetadata 获取服务元数据的函数
 * @param executeToolCall 执行工具调用的函数
 * @returns 工具代理对象
 */
export function createToolProxy(
  fetchMetadata: (serviceId: string) => Promise<ServiceMetadata>,
  executeToolCall: (serviceId: string, toolName: string, params: any) => Promise<ToolCallResult>
): ToolProxy {
  const serviceCache = new Map<string, ServiceMetadata>();
  
  // 创建代理对象
  return new Proxy({} as ToolProxy, {
    get(target, serviceName: string) {
      // 忽略内部属性访问
      if (typeof serviceName !== 'string' || serviceName.startsWith('_')) {
        return undefined;
      }
      
      // 返回服务工具代理
      return new Proxy({}, {
        get(_target, toolName: string) {
          // 忽略内部属性访问
          if (typeof toolName !== 'string' || toolName.startsWith('_')) {
            return undefined;
          }
          
          // 返回工具调用函数
          return async (params: any): Promise<any> => {
            try {
              // 获取服务元数据（使用缓存）
              let metadata = serviceCache.get(serviceName);
              if (!metadata) {
                metadata = await fetchMetadata(serviceName);
                serviceCache.set(serviceName, metadata);
              }
              
              // 验证工具存在
              const toolExists = metadata.tools.some(tool => tool.name === toolName);
              if (!toolExists) {
                throw new Error(`工具 "${toolName}" 在服务 "${serviceName}" 中不存在`);
              }
              
              // 执行工具调用
              const result = await executeToolCall(serviceName, toolName, params);
              
              // 处理错误
              if (!result.success) {
                throw new Error(result.error || `调用工具 "${serviceName}.${toolName}" 失败`);
              }
              
              // 返回结果数据
              return result.data;
            } catch (error) {
              throw error instanceof Error 
                ? error 
                : new Error(`调用工具 "${serviceName}.${toolName}" 时发生错误: ${error}`);
            }
          };
        }
      });
    }
  });
}

/**
 * 验证工具参数
 * 
 * @param tool 工具定义
 * @param params 参数值
 * @returns 验证结果，成功返回true，失败返回错误信息
 */
export function validateToolParams(tool: MCPTool, params: any): true | string {
  const { inputSchema } = tool;
  
  // 检查必填字段
  if (inputSchema.required) {
    for (const requiredField of inputSchema.required) {
      if (params[requiredField] === undefined) {
        return `缺少必填参数: ${requiredField}`;
      }
    }
  }
  
  // 遍历每个定义的参数进行验证
  for (const [paramName, schema] of Object.entries(inputSchema.properties)) {
    const value = params[paramName];
    
    // 如果参数未提供且不是必填，则跳过
    if (value === undefined) {
      continue;
    }
    
    // 验证类型
    if (!validateType(value, schema.type)) {
      return `参数 ${paramName} 类型错误，期望 ${schema.type}`;
    }
    
    // 验证枚举值
    if (schema.enum && !schema.enum.includes(value)) {
      return `参数 ${paramName} 值无效，必须是以下之一: ${schema.enum.join(', ')}`;
    }
    
    // 验证数字范围
    if (schema.type === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        return `参数 ${paramName} 必须大于或等于 ${schema.minimum}`;
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        return `参数 ${paramName} 必须小于或等于 ${schema.maximum}`;
      }
    }
    
    // 验证字符串长度
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return `参数 ${paramName} 长度必须大于或等于 ${schema.minLength}`;
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return `参数 ${paramName} 长度必须小于或等于 ${schema.maxLength}`;
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        return `参数 ${paramName} 不符合模式要求`;
      }
    }
    
    // 验证数组
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        return `参数 ${paramName} 数组元素数量必须大于或等于 ${schema.minItems}`;
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        return `参数 ${paramName} 数组元素数量必须小于或等于 ${schema.maxItems}`;
      }
      
      // 验证数组元素
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          if (!validateType(value[i], schema.items.type)) {
            return `参数 ${paramName} 数组元素 [${i}] 类型错误，期望 ${schema.items.type}`;
          }
        }
      }
    }
  }
  
  return true;
}

/**
 * 验证值类型
 * 
 * @param value 要验证的值
 * @param expectedType 期望类型
 * @returns 是否符合类型要求
 */
function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true; // 未知类型默认通过
  }
} 