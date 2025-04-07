/**
 * MCPM 3.0 服务器创建
 * 提供声明式服务器API
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import { v4 as uuid } from 'uuid';
import { MCPServerDefinition, MCPServerSecurity, MCPTool, MCPServerType, MCPServerStatus } from '../../mcp/types';
import { ServerOptions, MCPServerInstance, ToolWithDefinition, ToolContext } from './types';
import { createToolContext } from './tools';

/**
 * 创建MCP服务器
 * @param options 服务器创建选项
 * @returns MCP服务器实例
 */
export function createServer(options: ServerOptions): MCPServerInstance {
  const { name, version, description = '', tools = [], security, port = 3000, logging = true } = options;
  
  // 创建Express应用
  const app = express();
  let server: any = null;
  
  // 存储工具定义和处理函数
  const toolsMap = new Map<string, ToolWithDefinition>();
  
  // 创建服务器定义
  const serverDefinition: MCPServerDefinition = {
    name,
    version,
    description,
    url: `http://localhost:${port}`,
    type: 'MCP' as MCPServerType,
    status: 'ACTIVE' as MCPServerStatus,
    security: security || {
      authenticationTypes: ['none']
    }
  };
  
  // 配置中间件
  app.use(cors());
  app.use(bodyParser.json());
  
  // 请求日志
  if (logging) {
    app.use(morgan('dev'));
  }
  
  // 请求ID中间件
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuid();
    next();
  });
  
  // 添加自定义前置中间件
  if (options.middleware?.before) {
    for (const middleware of options.middleware.before) {
      app.use(middleware);
    }
  }
  
  // 元数据路由
  app.get('/api/metadata', (req: Request, res: Response) => {
    const toolsList = Array.from(toolsMap.values()).map(t => t.definition);
    
    res.json({
      id: `${name}@${version}`,
      name,
      version,
      description,
      tools: toolsList,
      endpoint: `http://localhost:${port}/api/tools`
    });
  });
  
  // 工具列表路由
  app.get('/api/tools', (req: Request, res: Response) => {
    const toolsList = Array.from(toolsMap.values()).map(t => ({
      name: t.definition.name,
      description: t.definition.description
    }));
    
    res.json({ tools: toolsList });
  });
  
  // 工具调用路由
  app.post('/api/tools/:toolName', async function handleToolCall(req: Request, res: Response) {
    const { toolName } = req.params;
    const toolData = toolsMap.get(toolName);
    
    if (!toolData) {
      return res.status(404).json({
        success: false,
        error: `Tool "${toolName}" not found`
      });
    }
    
    const { definition, handler, validateInput, validateOutput, middlewares } = toolData;
    const params = req.body;
    
    // 创建工具上下文
    const context = createToolContext(req, res);
    
    try {
      // 运行中间件
      if (middlewares && middlewares.length > 0) {
        // 执行工具特定的中间件
        for (const middleware of middlewares) {
          await new Promise<void>((resolve, reject) => {
            try {
              middleware(req, res, () => resolve(), context);
            } catch (error) {
              reject(error);
            }
          });
          
          // 如果响应已经发送，则停止处理
          if (res.headersSent) {
            return;
          }
        }
      }
      
      // 验证输入参数
      if (validateInput) {
        const result = validateInput(params);
        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: `Invalid input: ${result.error}`
          });
        }
        
        // 使用验证后的数据
        Object.assign(params, result.data);
      }
      
      // 执行工具处理函数
      const startTime = Date.now();
      const result = await handler(params, context);
      const executionTime = Date.now() - startTime;
      
      // 验证输出（如果有验证器）
      if (validateOutput) {
        const validationResult = validateOutput(result);
        if (!validationResult.success) {
          return res.status(500).json({
            success: false,
            error: `Invalid output: ${validationResult.error}`
          });
        }
        
        // 使用验证后的数据
        Object.assign(result, validationResult.data);
      }
      
      // 返回成功结果
      return res.json({
        success: true,
        data: result,
        metadata: {
          requestId: req.headers['x-request-id'],
          executionTime,
          toolName: definition.name
        }
      });
    } catch (error) {
      // 处理错误
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        metadata: {
          requestId: req.headers['x-request-id'],
          toolName: definition.name
        }
      });
    }
  });
  
  // 健康检查路由
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', version });
  });
  
  // 添加自定义后置中间件
  if (options.middleware?.after) {
    for (const middleware of options.middleware.after) {
      app.use(middleware);
    }
  }
  
  // 错误处理中间件
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    }
  });
  
  // 添加工具定义的方法
  function addTool(toolDefinition: ToolWithDefinition) {
    toolsMap.set(toolDefinition.definition.name, toolDefinition);
  }
  
  // 添加初始工具
  if (Array.isArray(tools) && tools.length > 0) {
    for (const tool of tools) {
      if ('definition' in tool) {
        // 已经是ToolWithDefinition对象
        addTool(tool as unknown as ToolWithDefinition);
      }
    }
  }
  
  // 返回服务器实例
  return {
    definition: serverDefinition,
    
    async start(customPort?: number) {
      const serverPort = customPort || port;
      
      return new Promise<void>((resolve) => {
        server = app.listen(serverPort, () => {
          console.log(`MCP服务器 ${name}@${version} 已启动于 http://localhost:${serverPort}`);
          // 更新服务器URL
          serverDefinition.url = `http://localhost:${serverPort}`;
          resolve();
        });
      });
    },
    
    async stop() {
      return new Promise<void>((resolve, reject) => {
        if (!server) {
          return resolve();
        }
        
        server.close((err: any) => {
          if (err) {
            reject(err);
          } else {
            console.log(`MCP服务器 ${name}@${version} 已停止`);
            server = null;
            resolve();
          }
        });
      });
    },
    
    getTools() {
      return Array.from(toolsMap.values()).map(t => t.definition);
    },
    
    addTool(tool: MCPTool, handler: any, middlewares?: any[]) {
      addTool({
        definition: tool,
        handler,
        middlewares
      });
    }
  };
} 