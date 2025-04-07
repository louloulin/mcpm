/**
 * MCPM 3.0 声明式服务器示例
 * 
 * 这个示例展示了如何使用MCPM 3.0的声明式API创建一个简单的MCP服务器
 */

const { z } = require('zod');
const { v3 } = require('../../lib');
const { defineTool, createServer } = v3.server;

// 定义一个简单的翻译工具
const translateTool = defineTool({
  name: 'translate',
  description: '将文本从一种语言翻译为另一种语言',
  
  // 使用Zod定义输入架构
  input: z.object({
    text: z.string().min(1, '文本不能为空'),
    targetLanguage: z.string().length(2, '目标语言代码必须是2个字符'),
    sourceLanguage: z.string().length(2, '源语言代码必须是2个字符').optional().default('auto')
  }),
  
  // 定义输出架构（可选）
  output: z.object({
    translatedText: z.string(),
    sourceLanguage: z.string(),
    targetLanguage: z.string()
  }),
  
  // 实现处理函数
  handler: async ({ text, targetLanguage, sourceLanguage }) => {
    console.log(`翻译文本: "${text}"`);
    console.log(`从 ${sourceLanguage} 翻译到 ${targetLanguage}`);
    
    // 实际应用中会调用翻译API
    // 这里仅作示例，返回模拟数据
    const translatedText = `[${targetLanguage}] ${text}`;
    
    return {
      translatedText,
      sourceLanguage,
      targetLanguage
    };
  }
});

// 定义问候工具
const greetingTool = defineTool({
  name: 'greeting',
  description: '生成个性化的问候消息',
  
  input: z.object({
    name: z.string().min(1, '名字不能为空'),
    formal: z.boolean().optional().default(false),
    language: z.enum(['zh', 'en', 'ja', 'fr']).optional().default('zh')
  }),
  
  handler: async ({ name, formal, language }) => {
    const greetings = {
      zh: { formal: `尊敬的 ${name}，您好！`, casual: `嗨，${name}！` },
      en: { formal: `Dear ${name},`, casual: `Hey, ${name}!` },
      ja: { formal: `${name}様、こんにちは！`, casual: `やあ、${name}さん！` },
      fr: { formal: `Cher/Chère ${name},`, casual: `Salut, ${name}!` }
    };
    
    const languageGreetings = greetings[language] || greetings.en;
    const greeting = formal ? languageGreetings.formal : languageGreetings.casual;
    
    return { message: greeting };
  }
});

// 创建服务器
const server = createServer({
  name: 'demo-mcp-server',
  version: '1.0.0',
  description: 'MCPM 3.0 示例服务器',
  
  // 添加工具
  tools: [translateTool, greetingTool],
  
  // 配置安全设置
  security: {
    authenticationTypes: ['none', 'api_key'],
    protectedRoutes: ['/api/tools/translate'],
    rateLimit: {
      limit: 10,
      period: 60 // 秒
    }
  },
  
  // 配置日志
  logging: {
    requests: true,
    errors: true
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.start(PORT).then(() => {
  console.log(`
示例服务器已启动!
  
API文档: http://localhost:${PORT}/api/metadata
使用工具:
- 问候工具: curl -X POST -H "Content-Type: application/json" -d '{"name":"世界"}' http://localhost:${PORT}/api/tools/greeting
- 翻译工具: curl -X POST -H "Content-Type: application/json" -d '{"text":"你好，世界","targetLanguage":"en"}' http://localhost:${PORT}/api/tools/translate
`);
}); 