import { 
  MCPServerDefinition, 
  MCPServerType, 
  MCPServerStatus,
  MCPTool,
  MCPRateLimit
} from '../../lib/mcp/types';

/**
 * 简单文本处理服务器工具定义
 */
const textProcessingTools: MCPTool[] = [
  {
    name: 'textSummarize',
    description: '将长文本总结为简短的摘要',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '需要被总结的文本内容',
          minLength: 50
        },
        maxLength: {
          type: 'number',
          description: '摘要的最大长度（单词数）',
          default: 100
        }
      },
      required: ['text']
    }
  },
  {
    name: 'textTranslate',
    description: '将文本从一种语言翻译为另一种语言',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '需要翻译的文本'
        },
        sourceLanguage: {
          type: 'string',
          description: '源语言代码 (如 "en", "zh", "ja")',
          default: 'auto'
        },
        targetLanguage: {
          type: 'string',
          description: '目标语言代码',
          default: 'en'
        }
      },
      required: ['text', 'targetLanguage']
    }
  },
  {
    name: 'textAnalysis',
    description: '分析文本的情感、关键词和主题',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '需要分析的文本'
        },
        analysisTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['sentiment', 'keywords', 'topics']
          },
          description: '需要执行的分析类型',
          default: ['sentiment', 'keywords']
        }
      },
      required: ['text']
    }
  }
];

/**
 * 文本处理MCP服务器定义
 */
export const textProcessingServer: MCPServerDefinition = {
  name: 'text-processing-server',
  version: '1.0.0',
  description: '一个用于文本处理的MCP服务器，提供总结、翻译和分析功能',
  url: 'http://localhost:3100/api/mcp/text-processor',
  type: MCPServerType.TOOL,
  status: MCPServerStatus.ACTIVE,
  
  // 基本元数据
  tags: ['text-processing', 'nlp', 'translation', 'summarization'],
  author: 'MCPM Team',
  license: 'MIT',
  homepage: 'https://example.com/text-processor',
  
  // 增强元数据
  metadata: {
    category: 'natural-language-processing',
    keywords: ['text', 'nlp', 'ai', 'language', 'processing'],
    maintainers: [
      {
        name: 'MCPM Development Team',
        email: 'support@example.com'
      }
    ],
    support: {
      email: 'support@example.com',
      documentation: 'https://example.com/docs/text-processor'
    },
    compatibility: {
      clients: ['nodejs', 'web', 'python'],
      mcpVersion: ['1.0.0', '1.1.0'],
      languages: ['en', 'zh', 'ja', 'es', 'fr']
    },
    resources: {
      cpu: '1',
      memory: '512',
      storage: '50'
    },
    pricing: {
      type: 'freemium',
      price: '10',
      currency: 'USD',
      billingCycle: 'monthly',
      trialPeriod: 30
    }
  },
  
  // 服务器安全设置
  security: {
    authenticationTypes: ['api_key'],
    protectedRoutes: ['/api/mcp/text-processor/*'],
    rateLimit: {
      limit: 100,
      period: 60,
      byIp: true,
      byUser: true
    },
    trustedPublishers: ['MCPM Team']
  }
};

// 导出默认服务器定义
export default textProcessingServer; 