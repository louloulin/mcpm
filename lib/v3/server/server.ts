/**
 * MCPM 3.0 声明式服务器API
 * 提供简化的MCP服务器创建接口
 */

import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
// @ts-ignore - Ignore body-parser typings issue
import bodyParser from 'body-parser';
import { v4 as uuid } from 'uuid';
import { ToolWithDefinition, ToolMiddleware } from './types';
import { createToolContext } from './tools';

export interface ServerOptions {
  /** 服务器名称 */
  name: string;
  /** 服务器版本 */
  version: string;
  /** 服务描述 */
  description?: string;
  /** MCP工具列表 */
  tools: ToolWithDefinition[];
  /** 安全配置 */
  security?: {
    /** 认证类型 */
    authenticationTypes?: ('none' | 'api_key' | 'oauth2')[];
    /** 受保护的路由 */
    protectedRoutes?: string[];
    /** 速率限制 */
    rateLimit?: {
      /** 时间窗口内的请求数限制 */
      limit: number;
      /** 时间窗口（秒） */
      period: number;
    };
  };
  /** 自定义中间件 */
  middleware?: RequestHandler[];
  /** 日志配置 */
  logging?: {
    /** 请求日志 */
    requests?: boolean;
    /** 错误日志 */
    errors?: boolean;
  };
}

export interface MCPServer {
  /** Express应用实例 */
  app: Express;
  /** 启动服务器 */
  start: (port?: number) => Promise<void>;
  /** 停止服务器 */
  stop: () => Promise<void>;
  /** 添加工具 */
  addTool: (tool: ToolWithDefinition) => void;
  /** 移除工具 */
  removeTool: (toolName: string) => boolean;
}

/**
 * 创建MCP服务器
 * @param options 服务器配置选项
 * @returns MCP服务器实例
 */
export function createServer(options: ServerOptions): MCPServer {
  const { name, version, description = '', tools = [], security, middleware = [], logging } = options;

  // 创建Express应用
  const app = express();
  let server: any = null;
  const allTools = [...tools];

  // 配置基本中间件
  app.use(cors());
  app.use(bodyParser.json());

  // 添加请求ID
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuid();
    next();
  });

  // 请求日志
  if (logging?.requests) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // 添加自定义中间件
  middleware.forEach(mw => app.use(mw));

  // 定义类型为RequestHandler的认证中间件
  const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (!security?.authenticationTypes?.includes('api_key')) {
      return next();
    }

    const isProtected = security.protectedRoutes?.some(route => {
      if (route.endsWith('*')) {
        return req.path.startsWith(route.slice(0, -1));
      }
      return req.path === route;
    });

    if (!isProtected) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: '需要API密钥进行认证'
      });
    }

    // 这里应添加验证API密钥的逻辑
    // 暂时简单地将它附加到req对象上
    (req as any).apiKey = apiKey;
    next();
  };

  // 安全中间件应用
  if (security) {
    // 添加API密钥认证
    if (security.authenticationTypes?.includes('api_key')) {
      app.use(authMiddleware);
    }

    // 速率限制实现
    if (security.rateLimit) {
      const { limit, period } = security.rateLimit;
      const requests: Record<string, number[]> = {};

      const rateLimitMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
        const clientIp = req.ip || req.connection.remoteAddress || '';
        const now = Date.now();
        
        // 初始化或清理过期请求
        if (!requests[clientIp]) {
          requests[clientIp] = [];
        } else {
          requests[clientIp] = requests[clientIp].filter(time => now - time < period * 1000);
        }

        // 检查是否超过限制
        if (requests[clientIp].length >= limit) {
          return res.status(429).json({
            success: false,
            error: '请求过于频繁，请稍后再试'
          });
        }

        // 记录请求
        requests[clientIp].push(now);
        next();
      };

      app.use(rateLimitMiddleware);
    }
  }

  // 元数据路由
  app.get('/api/metadata', (req: Request, res: Response) => {
    // 提取工具定义
    const toolDefinitions = allTools.map(tool => tool.definition);

    res.json({
      name,
      version,
      description,
      authenticationTypes: security?.authenticationTypes || ['none'],
      tools: toolDefinitions,
      endpoint: `http://${req.headers.host}/api/tools`
    });
  });

  // 工具列表路由
  app.get('/api/tools', (req: Request, res: Response) => {
    const toolDefinitions = allTools.map(tool => tool.definition);
    res.json({ tools: toolDefinitions });
  });

  // 为每个工具创建路由
  function setupToolRoutes() {
    allTools.forEach(tool => {
      const { definition, handler, validateInput, validateOutput, middlewares = [] } = tool;
      
      // 处理工具调用
      const processToolRequest: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          // 验证输入
          if (validateInput) {
            const validation = validateInput(req.body);
            if (!validation.success) {
              return res.status(400).json({
                success: false,
                error: `输入验证失败: ${validation.error}`
              });
            }
            
            // 创建上下文
            const context = createToolContext(req, res);
            
            // 调用处理函数
            const result = await handler(validation.data, context);
            
            // 验证输出（如果提供了验证器）
            if (validateOutput) {
              const outputValidation = validateOutput(result);
              if (!outputValidation.success) {
                return res.status(500).json({
                  success: false,
                  error: `输出验证失败: ${outputValidation.error}`
                });
              }
              
              return res.json({
                success: true,
                data: outputValidation.data
              });
            }
            
            // 如果没有输出验证器，直接返回结果
            return res.json({
              success: true,
              data: result
            });
          } else {
            // 如果没有验证器，直接调用处理函数
            const context = createToolContext(req, res);
            const result = await handler(req.body, context);
            
            return res.json({
              success: true,
              data: result
            });
          }
        } catch (error) {
          next(error);
        }
      };
      
      // 将中间件转换为标准的Express中间件
      const expressMiddlewares: RequestHandler[] = middlewares.map(
        (middleware: ToolMiddleware): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
          try {
            // 创建上下文
            const context = createToolContext(req, res);
            // 调用中间件
            middleware(req, res, next, context);
          } catch (error) {
            next(error);
          }
        }
      );
      
      // 添加路由和处理程序
      app.post(`/api/tools/${definition.name}`, ...expressMiddlewares, processToolRequest);
    });
  }
  
  // 设置工具路由
  setupToolRoutes();
  
  // 错误处理中间件
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (logging?.errors) {
      console.error(`[${new Date().toISOString()}] Error:`, err);
    }
    
    res.status(500).json({
      success: false,
      error: err.message || '服务器内部错误'
    });
  });
  
  return {
    app,
    
    // 启动服务器
    async start(port = 3000): Promise<void> {
      return new Promise((resolve) => {
        server = app.listen(port, () => {
          console.log(`MCP服务器已启动: http://localhost:${port}/api/metadata`);
          resolve();
        });
      });
    },
    
    // 停止服务器
    async stop(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!server) {
          return resolve();
        }
        
        server.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            server = null;
            resolve();
          }
        });
      });
    },
    
    // 添加工具
    addTool(tool: ToolWithDefinition): void {
      // 检查是否已存在同名工具
      const existingIndex = allTools.findIndex(t => 
        t.definition.name === tool.definition.name);
      
      if (existingIndex >= 0) {
        // 替换现有工具
        allTools[existingIndex] = tool;
      } else {
        // 添加新工具
        allTools.push(tool);
      }
      
      // 重新设置路由（简单实现）
      setupToolRoutes();
    },
    
    // 移除工具
    removeTool(toolName: string): boolean {
      const initialLength = allTools.length;
      const filteredTools = allTools.filter(tool => 
        tool.definition.name !== toolName);
      
      if (filteredTools.length < initialLength) {
        // 更新工具列表
        allTools.splice(0, allTools.length, ...filteredTools);
        // 重新设置路由（简单实现）
        setupToolRoutes();
        return true;
      }
      
      return false;
    }
  };
} 