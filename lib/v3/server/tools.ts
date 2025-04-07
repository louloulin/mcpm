/**
 * MCPM 3.0 工具定义
 * 提供声明式工具定义API
 */

import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { MCPTool, ToolParameterSchema } from '../../mcp/types';
import { ToolDefinitionOptions, ToolHandler, ToolMiddleware, ToolWithDefinition } from './types';

/**
 * 将Zod类型转换为MCP参数Schema
 * @param schema Zod类型模式
 * @returns MCP参数Schema
 */
function zodToMCPSchema(schema: z.ZodType): ToolParameterSchema {
  // 处理原始类型
  if (schema instanceof z.ZodString) {
    const result: ToolParameterSchema = { type: 'string' };
    
    // 处理字符串约束 - 使用不依赖于内部结构的更健壮方法
    const stringSchema = schema as z.ZodString;
    
    // 通过检查解析来获取约束信息
    try {
      stringSchema.min(1).parse('');
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最小长度
        const errorMessage = e.issues[0].message;
        const minMatch = errorMessage.match(/at least (\d+)/);
        if (minMatch && minMatch[1]) {
          const minLength = Number(minMatch[1]);
          if (!isNaN(minLength)) result.minLength = minLength;
        }
      }
    }
    
    try {
      stringSchema.max(1).parse('ab');
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最大长度
        const errorMessage = e.issues[0].message;
        const maxMatch = errorMessage.match(/at most (\d+)/);
        if (maxMatch && maxMatch[1]) {
          const maxLength = Number(maxMatch[1]);
          if (!isNaN(maxLength)) result.maxLength = maxLength;
        }
      }
    }
    
    // 处理枚举 - 通过简单检测可能的值
    try {
      const enumValues = (schema as any)._def?.values;
      if (Array.isArray(enumValues)) {
        result.enum = enumValues;
      }
    } catch (e) {
      // 忽略无法处理的情况
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodNumber) {
    const result: ToolParameterSchema = { type: 'number' };
    
    // 处理数字约束 - 使用不依赖于内部结构的更健壮方法
    const numberSchema = schema as z.ZodNumber;
    
    // 通过检查解析来获取约束信息
    try {
      numberSchema.min(1).parse(0);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最小值
        const errorMessage = e.issues[0].message;
        const minMatch = errorMessage.match(/greater than or equal to (\d+)/);
        if (minMatch && minMatch[1]) {
          const minimum = Number(minMatch[1]);
          if (!isNaN(minimum)) result.minimum = minimum;
        }
      }
    }
    
    try {
      numberSchema.max(1).parse(2);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最大值
        const errorMessage = e.issues[0].message;
        const maxMatch = errorMessage.match(/less than or equal to (\d+)/);
        if (maxMatch && maxMatch[1]) {
          const maximum = Number(maxMatch[1]);
          if (!isNaN(maximum)) result.maximum = maximum;
        }
      }
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }
  
  if (schema instanceof z.ZodArray) {
    const result: ToolParameterSchema = { 
      type: 'array',
      items: zodToMCPSchema(schema.element)
    };
    
    // 处理数组约束 - 使用不依赖于内部结构的更健壮方法
    const arraySchema = schema as z.ZodArray<any>;
    
    try {
      arraySchema.min(1).parse([]);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最小项数
        const errorMessage = e.issues[0].message;
        const minMatch = errorMessage.match(/at least (\d+)/);
        if (minMatch && minMatch[1]) {
          const minItems = Number(minMatch[1]);
          if (!isNaN(minItems)) result.minItems = minItems;
        }
      }
    }
    
    try {
      arraySchema.max(1).parse([1, 2]);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        // 改用错误消息中提取最大项数
        const errorMessage = e.issues[0].message;
        const maxMatch = errorMessage.match(/at most (\d+)/);
        if (maxMatch && maxMatch[1]) {
          const maxItems = Number(maxMatch[1]);
          if (!isNaN(maxItems)) result.maxItems = maxItems;
        }
      }
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, ToolParameterSchema> = {};
    
    // 处理对象属性
    for (const [key, value] of Object.entries(schema.shape)) {
      properties[key] = zodToMCPSchema(value as z.ZodType);
    }
    
    return {
      type: 'object',
      properties
    };
  }
  
  if (schema instanceof z.ZodOptional) {
    const result = zodToMCPSchema(schema.unwrap());
    result.required = false;
    return result;
  }
  
  if (schema instanceof z.ZodDefault) {
    const result = zodToMCPSchema(schema.removeDefault());
    // 使用更安全的方式获取默认值
    try {
      result.default = schema.parse(undefined);
    } catch {
      // 忽略无法解析的默认值
    }
    return result;
  }
  
  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options
    };
  }
  
  if (schema instanceof z.ZodUnion) {
    // 对于联合类型，选择第一个类型作为基本类型
    if (schema._def.options.length > 0) {
      return zodToMCPSchema(schema._def.options[0]);
    }
  }
  
  // 默认情况，返回对象类型
  return { type: 'object' };
}

/**
 * 从Zod对象Schema中提取必需字段
 * @param schema Zod对象Schema
 * @returns 必需字段列表
 */
function getRequiredFields(schema: z.ZodObject<any>): string[] {
  const required: string[] = [];
  
  for (const [key, value] of Object.entries(schema.shape)) {
    // 如果字段不是可选的，则是必需的
    if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
      required.push(key);
    }
  }
  
  return required;
}

/**
 * 定义MCP工具
 * @param options 工具定义选项
 * @returns 工具定义对象
 */
export function defineTool<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
>(options: ToolDefinitionOptions<TInput, TOutput>): ToolWithDefinition {
  const { name, description, input, output, handler, middlewares } = options;
  
  // 验证输入Schema是否为对象
  if (!(input instanceof z.ZodObject)) {
    throw new Error(`工具 ${name} 的输入Schema必须是Zod对象`);
  }
  
  // 转换Zod Schema为MCP参数Schema
  const inputProperties: Record<string, ToolParameterSchema> = {};
  for (const [key, value] of Object.entries(input.shape)) {
    inputProperties[key] = zodToMCPSchema(value as z.ZodType);
  }
  
  // 提取必需字段
  const required = getRequiredFields(input);
  
  // 创建MCP工具定义
  const definition: MCPTool = {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties: inputProperties,
      required: required.length > 0 ? required : undefined
    }
  };
  
  // 创建输入验证函数
  const validateInput = (data: any) => {
    try {
      const result = input.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '输入验证失败'
      };
    }
  };
  
  // 创建输出验证函数（如果提供了输出Schema）
  let validateOutput;
  if (output) {
    validateOutput = (data: any) => {
      try {
        const result = output.safeParse(data);
        if (result.success) {
          return { success: true, data: result.data };
        } else {
          return { 
            success: false, 
            error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '输出验证失败'
        };
      }
    };
  }
  
  // 返回完整工具定义
  return {
    definition,
    handler,
    middlewares,
    validateInput,
    validateOutput
  };
}

/**
 * 创建请求上下文
 * @param req Express请求对象
 * @param res Express响应对象
 * @returns 工具上下文对象
 */
export function createToolContext(req: any, res: any): any {
  return {
    req,
    res,
    requestId: req.headers['x-request-id'] || uuid(),
    auth: {
      userId: req.user?.id,
      token: req.token,
      apiKey: req.apiKey
    },
    metadata: {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  };
} 