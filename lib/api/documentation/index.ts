import { readFileSync } from 'fs';
import { join } from 'path';
import * as swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../../package.json';

// 定义API文档基础信息
const apiDocOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP Server Repository API',
      version,
      description: 'API documentation for the MCP Server Repository platform',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'MCP Team',
        url: 'https://glama.ai/mcp',
        email: 'support@glama.ai',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'MCP API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
          description: 'API Key for server-to-server authentication',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Servers', description: 'Operations related to MCP servers' },
      { name: 'Users', description: 'User management operations' },
      { name: 'Authentication', description: 'Authentication and authorization' },
      { name: 'Webhooks', description: 'Webhook management and events' },
      { name: 'Collections', description: 'Server collections management' },
      { name: 'Stats', description: 'Statistical data endpoints' },
      { name: 'Notifications', description: 'User notification management' },
      { name: 'Files', description: 'File storage operations' },
      { name: 'Tools', description: 'MCP tool operations' },
      { name: 'Recommendations', description: 'Server recommendation operations' },
    ],
  },
  // 指定包含API注释的文件
  apis: [
    'lib/api/routes/**/*.ts',
    'lib/api/controllers/**/*.ts',
    'app/api/**/*.ts',
  ],
};

// 从文件中加载模型定义
function loadModelDefinitions() {
  try {
    const modelDefsPath = join(__dirname, 'model-definitions.json');
    const modelDefs = JSON.parse(readFileSync(modelDefsPath, 'utf8'));
    return modelDefs;
  } catch (error) {
    console.warn('API model definitions not found or invalid: ', error);
    return {};
  }
}

// 合并模型定义到Swagger定义中
function addModelDefinitions(swaggerDef: any) {
  const modelDefs = loadModelDefinitions();
  
  if (!swaggerDef.components) {
    swaggerDef.components = {};
  }
  
  if (!swaggerDef.components.schemas) {
    swaggerDef.components.schemas = {};
  }
  
  // 合并模型定义
  swaggerDef.components.schemas = {
    ...swaggerDef.components.schemas,
    ...modelDefs,
  };
  
  return swaggerDef;
}

/**
 * 生成OpenAPI/Swagger文档
 */
export function generateApiDocs() {
  try {
    // 使用swagger-jsdoc生成基本文档
    const swaggerSpec = swaggerJsdoc(apiDocOptions);
    
    // 添加模型定义
    const enhancedSpec = addModelDefinitions(swaggerSpec);
    
    return enhancedSpec;
  } catch (error) {
    console.error('Error generating API documentation:', error);
    throw error;
  }
}

/**
 * 获取特定标签的API文档
 */
export function getApiDocsByTag(tag: string) {
  const fullDocs = generateApiDocs();
  
  // 过滤出特定标签的API路径
  const filteredPaths: Record<string, any> = {};
  
  for (const [path, methods] of Object.entries(fullDocs.paths || {})) {
    const filteredMethods: Record<string, any> = {};
    let hasTaggedMethod = false;
    
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (details.tags && details.tags.includes(tag)) {
        filteredMethods[method] = details;
        hasTaggedMethod = true;
      }
    }
    
    if (hasTaggedMethod) {
      filteredPaths[path] = filteredMethods;
    }
  }
  
  // 创建过滤后的文档
  const filteredDocs = {
    ...fullDocs,
    paths: filteredPaths,
    tags: fullDocs.tags.filter((t: any) => t.name === tag),
  };
  
  return filteredDocs;
}

/**
 * 将OpenAPI规范转换为更友好的格式
 */
export function convertToFriendlyFormat(openApiSpec: any) {
  const result: any = {
    info: openApiSpec.info,
    endpoints: [],
  };
  
  // 遍历所有路径和方法
  for (const [path, methods] of Object.entries(openApiSpec.paths || {})) {
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      result.endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: details.summary || '',
        description: details.description || '',
        tags: details.tags || [],
        parameters: details.parameters || [],
        requestBody: details.requestBody || null,
        responses: details.responses || {},
        security: details.security || openApiSpec.security,
      });
    }
  }
  
  // 按标签分组
  const groupedByTag: Record<string, any[]> = {};
  
  for (const endpoint of result.endpoints) {
    for (const tag of endpoint.tags) {
      if (!groupedByTag[tag]) {
        groupedByTag[tag] = [];
      }
      groupedByTag[tag].push(endpoint);
    }
  }
  
  result.endpointsByTag = groupedByTag;
  
  return result;
}

/**
 * 为单个路由生成API文档
 */
export function generateRouteDoc(routeInfo: {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  security?: any[];
}) {
  return routeInfo;
}

// 导出默认API文档生成器
export default {
  generateApiDocs,
  getApiDocsByTag,
  convertToFriendlyFormat,
  generateRouteDoc,
}; 