const modelDefinitions = require('./model-definitions.json');

/**
 * Swagger API文档基本配置
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP Server API',
      version: '1.0.0',
      description: 'MCP服务器仓库API文档',
      contact: {
        name: 'MCP团队',
        url: 'https://mcpserver.com/contact',
        email: 'support@mcpserver.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '本地开发环境'
      },
      {
        url: 'https://api.mcpserver.com/api',
        description: '生产环境'
      }
    ],
    components: {
      schemas: modelDefinitions,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'servers',
        description: '服务器管理API'
      },
      {
        name: 'users',
        description: '用户管理API'
      },
      {
        name: 'collections',
        description: '服务器集合API'
      },
      {
        name: 'webhooks',
        description: 'Webhook管理API'
      },
      {
        name: 'notifications',
        description: '通知管理API'
      },
      {
        name: 'stats',
        description: '数据统计API'
      },
      {
        name: 'recommendations',
        description: '服务器推荐API'
      }
    ]
  },
  apis: [
    './app/api/**/*.js', 
    './app/api/**/*.ts',
    './lib/api/routes/**/*.js',
    './lib/api/routes/**/*.ts',
    './lib/api/controllers/**/*.js',
    './lib/api/controllers/**/*.ts'
  ]
};

module.exports = swaggerOptions; 