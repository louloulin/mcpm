/**
 * MCPM 3.0 高级声明式服务器示例
 * 
 * 本示例展示了 MCPM 3.0 更高级的声明式API功能，包括：
 * - 中间件使用
 * - 错误处理
 * - 输入验证和转换
 * - 安全配置
 * - 自定义路由
 */

const { z } = require('zod');
const path = require('path');
const { v3 } = require('../..');
const { defineTool, createServer, createToolContext } = v3.server;

// ======== 定义工具 ========

// 1. 文本分析工具
const textAnalysisTool = defineTool({
  name: 'textAnalysis',
  description: '分析文本的情感、关键词和统计信息',
  
  // 使用Zod定义输入架构，带有复杂验证
  input: z.object({
    text: z.string().min(5, '文本至少需要5个字符').max(5000, '文本不能超过5000个字符'),
    language: z.enum(['zh', 'en', 'ja', 'fr']).optional().default('en'),
    options: z.object({
      includeSentiment: z.boolean().optional().default(true),
      includeKeywords: z.boolean().optional().default(true),
      includeStatistics: z.boolean().optional().default(true)
    }).optional().default({})
  }),
  
  // 定义输出架构
  output: z.object({
    sentiment: z.object({
      score: z.number(),
      label: z.enum(['positive', 'negative', 'neutral'])
    }).optional(),
    keywords: z.array(z.string()).optional(),
    statistics: z.object({
      characterCount: z.number(),
      wordCount: z.number(),
      sentenceCount: z.number()
    }).optional()
  }),
  
  // 中间件：记录请求
  middlewares: [
    async (ctx, next) => {
      const startTime = Date.now();
      console.log(`[${new Date().toISOString()}] 请求工具: textAnalysis`);
      
      // 调用下一个中间件或处理函数
      await next();
      
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] 完成处理，耗时: ${duration}ms`);
    }
  ],
  
  // 处理函数
  handler: async ({ text, language, options }, ctx) => {
    const { includeSentiment, includeKeywords, includeStatistics } = options;
    const result = {};
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 情感分析
    if (includeSentiment) {
      // 简单的情感分析模拟
      const sentimentScore = Math.random() * 2 - 1; // -1到1之间
      let sentimentLabel = 'neutral';
      
      if (sentimentScore > 0.3) sentimentLabel = 'positive';
      else if (sentimentScore < -0.3) sentimentLabel = 'negative';
      
      result.sentiment = {
        score: sentimentScore,
        label: sentimentLabel
      };
    }
    
    // 关键词提取
    if (includeKeywords) {
      // 简单拆分为单词并选择一些较长的单词作为"关键词"
      const words = text.split(/\s+/);
      result.keywords = words
        .filter(word => word.length > 5)
        .slice(0, 5)
        .map(word => word.replace(/[.,!?;:]/g, ''));
    }
    
    // 统计信息
    if (includeStatistics) {
      result.statistics = {
        characterCount: text.length,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        sentenceCount: text.split(/[.!?]+/).filter(Boolean).length
      };
    }
    
    return result;
  }
});

// 2. 图像处理工具
const imageProcessorTool = defineTool({
  name: 'imageProcessor',
  description: '处理图像，支持调整大小、应用滤镜等操作',
  
  input: z.object({
    // 这里使用字符串URL，实际应用中可能需要处理文件上传
    imageUrl: z.string().url('请提供有效的图像URL'),
    operations: z.array(
      z.object({
        type: z.enum(['resize', 'crop', 'filter', 'rotate']),
        // 每种操作类型的参数
        params: z.record(z.any())
      })
    ).min(1, '至少需要一个操作')
  }),
  
  // 错误处理中间件
  middlewares: [
    async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        console.error('图像处理错误:', error);
        // 重写错误为更友好的信息
        throw new Error(`图像处理失败: ${error.message}`);
      }
    }
  ],
  
  handler: async ({ imageUrl, operations }) => {
    console.log(`处理图像: ${imageUrl}`);
    console.log(`操作数量: ${operations.length}`);
    
    // 模拟处理
    const results = operations.map(operation => {
      console.log(`应用操作: ${operation.type}`, operation.params);
      
      // 模拟不同操作的结果
      switch(operation.type) {
        case 'resize':
          return {
            type: 'resize',
            success: true,
            dimensions: {
              width: operation.params.width || 100,
              height: operation.params.height || 100,
            }
          };
        case 'crop':
          return {
            type: 'crop',
            success: true,
            region: {
              x: operation.params.x || 0,
              y: operation.params.y || 0,
              width: operation.params.width || 50,
              height: operation.params.height || 50
            }
          };
        case 'filter':
          return {
            type: 'filter',
            success: true,
            filter: operation.params.name || 'none'
          };
        case 'rotate':
          return {
            type: 'rotate',
            success: true,
            angle: operation.params.angle || 0
          };
        default:
          return {
            type: operation.type,
            success: false,
            error: '不支持的操作'
          };
      }
    });
    
    return {
      processedImageUrl: `${imageUrl}?processed=true`,
      operations: results
    };
  }
});

// 3. 数据转换工具
const dataTransformTool = defineTool({
  name: 'dataTransform',
  description: '转换数据格式，如JSON到CSV、XML到JSON等',
  
  input: z.object({
    data: z.any(),
    sourceFormat: z.enum(['json', 'csv', 'xml', 'yaml']),
    targetFormat: z.enum(['json', 'csv', 'xml', 'yaml']),
    options: z.object({
      pretty: z.boolean().optional().default(false),
      includeHeaders: z.boolean().optional().default(true)
    }).optional().default({})
  }),
  
  handler: async ({ data, sourceFormat, targetFormat, options }) => {
    console.log(`数据转换: ${sourceFormat} -> ${targetFormat}`);
    
    // 简单模拟转换结果
    let result = {
      converted: true,
      sourceFormat,
      targetFormat,
      sampleOutput: `这是转换后的${targetFormat}格式数据的示例`
    };
    
    if (options.pretty) {
      result.formattedSample = `# 格式化后的${targetFormat}示例\n---\n样本数据`;
    }
    
    return result;
  }
});

// ======== 创建服务器 ========

const server = createServer({
  name: 'advanced-mcp-server',
  version: '1.0.0',
  description: 'MCPM 3.0 高级声明式服务器示例',
  
  // 注册工具
  tools: [textAnalysisTool, imageProcessorTool, dataTransformTool],
  
  // 全局中间件
  middlewares: [
    // 请求日志中间件
    async (req, res, next) => {
      const start = Date.now();
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      
      // 调用下一个中间件
      await next();
      
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} 完成，状态码: ${res.statusCode}，耗时: ${duration}ms`);
    },
    
    // 错误处理中间件
    async (req, res, next) => {
      try {
        await next();
      } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({
          error: 'internal_server_error',
          message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : error.message
        });
      }
    }
  ],
  
  // 配置安全
  security: {
    // 支持的认证类型
    authenticationTypes: ['none', 'api_key', 'oauth2'],
    
    // API密钥配置
    apiKey: {
      headerName: 'X-API-Key',
      queryParamName: 'api_key',
      keys: [
        { key: 'test-key-1', role: 'admin' },
        { key: 'test-key-2', role: 'user' }
      ]
    },
    
    // OAuth2配置
    oauth2: {
      jwksUrl: 'https://example.auth0.com/.well-known/jwks.json',
      audience: 'https://api.example.com',
      issuer: 'https://example.auth0.com/'
    },
    
    // 保护的路径
    protectedRoutes: [
      '/api/tools/imageProcessor', 
      '/api/tools/dataTransform'
    ],
    
    // 速率限制
    rateLimit: {
      limit: 100,      // 请求次数
      period: 60,      // 时间段（秒）
      trustProxy: true // 信任代理头部
    },
    
    // CORS配置
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }
  },
  
  // 存储配置
  storage: {
    type: 'memory', // 'memory', 'file', 'redis', 等
    options: {
      directory: path.join(__dirname, 'data')
    }
  },
  
  // 日志配置
  logging: {
    level: 'info',     // 'error', 'warn', 'info', 'debug'
    requests: true,    // 记录请求
    errors: true,      // 记录错误
    format: 'json',    // 'plain', 'json'
    destination: 'console' // 'console', 'file'
  },
  
  // 自定义路由处理器
  customRoutes: [
    {
      path: '/health',
      method: 'get',
      handler: async (req, res) => {
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: process.uptime()
        });
      }
    },
    {
      path: '/api/examples',
      method: 'get',
      handler: async (req, res) => {
        res.json({
          textAnalysis: {
            inputExample: {
              text: "Natural language processing is fascinating. It allows computers to understand human language.",
              language: "en",
              options: {
                includeSentiment: true,
                includeKeywords: true,
                includeStatistics: true
              }
            }
          },
          imageProcessor: {
            inputExample: {
              imageUrl: "https://example.com/sample.jpg",
              operations: [
                {
                  type: "resize",
                  params: {
                    width: 800,
                    height: 600
                  }
                },
                {
                  type: "filter",
                  params: {
                    name: "grayscale"
                  }
                }
              ]
            }
          }
        });
      }
    }
  ]
});

// 启动服务器
const PORT = process.env.PORT || 3100;
server.start(PORT).then(() => {
  console.log(`
=================================================
🚀 MCPM 3.0 高级示例服务器已启动!
=================================================
  
📚 API文档: http://localhost:${PORT}/api/metadata
🔧 健康检查: http://localhost:${PORT}/health
📋 示例请求: http://localhost:${PORT}/api/examples

使用示例:
1. 文本分析:
   curl -X POST http://localhost:${PORT}/api/tools/textAnalysis \\
     -H "Content-Type: application/json" \\
     -d '{"text":"Natural language processing is fascinating!","language":"en"}'

2. 图像处理 (需要API密钥):
   curl -X POST http://localhost:${PORT}/api/tools/imageProcessor \\
     -H "Content-Type: application/json" \\
     -H "X-API-Key: test-key-1" \\
     -d '{"imageUrl":"https://example.com/image.jpg","operations":[{"type":"resize","params":{"width":300,"height":200}}]}'

3. 数据转换 (需要API密钥):
   curl -X POST http://localhost:${PORT}/api/tools/dataTransform \\
     -H "Content-Type: application/json" \\
     -H "X-API-Key: test-key-1" \\
     -d '{"data":{"key":"value"},"sourceFormat":"json","targetFormat":"yaml"}'
=================================================
`);
}); 