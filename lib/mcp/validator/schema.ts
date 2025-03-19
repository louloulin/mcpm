/**
 * MCP规范验证schema
 * 用于验证MCP服务器定义是否符合规范
 */

import { z } from 'zod';
import { MCPServerDefinition, MCPServerType, MCPServerStatus, MCPValidationResult } from '../types';

// 定义工具参数schema的类型
type ToolParameterSchema = z.ZodType<{
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  default?: any;
  required?: boolean;
  properties?: Record<string, any>;
  items?: any;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}>;

// 工具参数schema验证
export const toolParameterSchema: ToolParameterSchema = z.lazy(() => 
  z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    default: z.any().optional(),
    required: z.boolean().optional(),
    properties: z.record(z.string(), toolParameterSchema).optional(),
    items: toolParameterSchema.optional(),
    minItems: z.number().int().positive().optional(),
    maxItems: z.number().int().positive().optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    format: z.string().optional(),
  })
);

// 工具定义验证
export const mcpToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), toolParameterSchema),
    required: z.array(z.string()).optional(),
  }),
});

// 路由参数验证
export const routeParameterSchema = z.object({
  name: z.string().min(1),
  location: z.enum(['query', 'path', 'body', 'header']),
  description: z.string().optional(),
  type: z.string(),
  required: z.boolean(),
  default: z.any().optional(),
  example: z.any().optional()
});

// 路由响应验证
export const routeResponseSchema = z.object({
  description: z.string().optional(),
  contentType: z.string(),
  example: z.any().optional(),
  schema: z.any().optional()
});

// 路由验证
export const routeSchema = z.object({
  path: z.string().min(1),
  methods: z.array(z.string()),
  description: z.string().optional(),
  parameters: z.array(routeParameterSchema).optional(),
  responses: z.record(z.string(), routeResponseSchema).optional()
});

// 访问规则验证
export const accessRuleSchema = z.object({
  route: z.string().min(1),
  methods: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  environments: z.array(z.string()).optional()
});

// 速率限制验证
export const rateLimitSchema = z.object({
  limit: z.number().int().positive(),
  period: z.number().int().positive(),
  byIp: z.boolean().optional(),
  byUser: z.boolean().optional()
});

// 安全设置验证
export const securitySchema = z.object({
  authenticationTypes: z.array(z.string()).optional(),
  protectedRoutes: z.array(z.string()).optional(),
  accessRules: z.array(accessRuleSchema).optional(),
  rateLimit: rateLimitSchema.optional()
});

// 服务器配置验证
export const serverConfigSchema = z.object({
  maxConnections: z.number().int().positive().optional(),
  timeout: z.number().int().positive().optional(),
  env: z.record(z.string(), z.string()).optional()
}).catchall(z.any());

// MCP服务器定义验证
export const mcpServerDefinitionSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/),
  description: z.string().optional(),
  url: z.string().url(),
  type: z.nativeEnum(MCPServerType),
  status: z.nativeEnum(MCPServerStatus),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
  config: serverConfigSchema.optional(),
  security: securitySchema.optional(),
  routes: z.array(routeSchema).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

/**
 * 验证MCP服务器定义是否符合Schema规范
 * @param serverDef MCP服务器定义
 * @returns 验证结果
 */
export function validateSchema(serverDef: MCPServerDefinition): MCPValidationResult {
  try {
    // 使用Zod验证结构
    mcpServerDefinitionSchema.parse(serverDef);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 将Zod错误转换为更友好的格式
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      return {
        valid: false,
        errors
      };
    }
    
    // 其他类型的错误
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

// MCP规范验证错误类型
export interface ValidationError {
  path: string;
  message: string;
} 