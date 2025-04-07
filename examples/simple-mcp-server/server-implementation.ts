import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import textProcessingServer from './server-definition';

// 创建Express应用
const app = express();

// 中间件
app.use(bodyParser.json());
app.use(cors());

// API密钥中间件
const apiKeyAuth = (req: Request, res: Response, next: Function) => {
  const apiKey = req.header('X-API-Key');
  
  // 这里是简单的演示，实际应用中应使用更安全的方式存储和验证API密钥
  if (!apiKey || apiKey !== 'demo-api-key') {
    return res.status(401).json({
      error: {
        code: 401,
        message: '无效的API密钥'
      }
    });
  }
  
  next();
};

// 速率限制映射（简化版，仅用于演示）
const rateLimits: Record<string, { count: number, resetTime: number }> = {};

// 速率限制中间件
const rateLimit = (req: Request, res: Response, next: Function) => {
  // 使用IP地址作为限制键（简化版）
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  // 如果记录不存在或已过期，创建新记录
  if (!rateLimits[key] || now > rateLimits[key].resetTime) {
    rateLimits[key] = {
      count: 1,
      resetTime: now + 60000 // 60秒后重置
    };
    return next();
  }
  
  // 检查是否超过限制
  if (rateLimits[key].count >= 100) {
    return res.status(429).json({
      error: {
        code: 429,
        message: '请求过于频繁，请稍后再试'
      }
    });
  }
  
  // 增加计数
  rateLimits[key].count++;
  next();
};

// 注册API路由
app.post('/api/mcp/text-processor/summarize', apiKeyAuth, rateLimit, async (req: Request, res: Response) => {
  try {
    const { text, maxLength = 100 } = req.body;
    
    // 验证输入
    if (!text || typeof text !== 'string' || text.length < 50) {
      return res.status(400).json({
        error: {
          code: 400,
          message: '文本长度必须至少为50个字符'
        }
      });
    }
    
    // 简单的摘要逻辑（实际应用中应使用更复杂的算法）
    const words = text.split(/\s+/);
    const summary = words.slice(0, Math.min(words.length, maxLength)).join(' ');
    
    // 返回结果
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id || Math.random().toString(36).substring(2, 9),
      result: {
        summary,
        originalLength: text.length,
        summaryLength: summary.length
      }
    });
  } catch (error) {
    console.error('摘要生成错误:', error);
    return res.status(500).json({
      error: {
        code: 500,
        message: '服务器内部错误'
      }
    });
  }
});

app.post('/api/mcp/text-processor/translate', apiKeyAuth, rateLimit, async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage = 'auto', targetLanguage = 'en' } = req.body;
    
    // 验证输入
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: {
          code: 400,
          message: '请提供有效的文本'
        }
      });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({
        error: {
          code: 400,
          message: '请提供目标语言'
        }
      });
    }
    
    // 简单的模拟翻译（实际应用中应集成真实的翻译API）
    const translation = `[从 ${sourceLanguage} 翻译到 ${targetLanguage}]: ${text}`;
    
    // 返回结果
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id || Math.random().toString(36).substring(2, 9),
      result: {
        translation,
        sourceLanguage,
        targetLanguage
      }
    });
  } catch (error) {
    console.error('翻译错误:', error);
    return res.status(500).json({
      error: {
        code: 500,
        message: '服务器内部错误'
      }
    });
  }
});

app.post('/api/mcp/text-processor/analyze', apiKeyAuth, rateLimit, async (req: Request, res: Response) => {
  try {
    const { text, analysisTypes = ['sentiment', 'keywords'] } = req.body;
    
    // 验证输入
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: {
          code: 400,
          message: '请提供有效的文本'
        }
      });
    }
    
    // 简单的文本分析（实际应用中应使用NLP库）
    const result: any = {};
    
    if (analysisTypes.includes('sentiment')) {
      // 简单的情感分析
      const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', '好', '优秀', '喜欢'];
      const negativeWords = ['bad', 'poor', 'terrible', 'sad', 'hate', '差', '糟糕', '讨厌'];
      
      let score = 0;
      const lowerText = text.toLowerCase();
      
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 1;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 1;
      });
      
      result.sentiment = {
        score,
        label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
      };
    }
    
    if (analysisTypes.includes('keywords')) {
      // 简单的关键词提取
      const words = text.toLowerCase().split(/\s+/);
      const wordCount: Record<string, number> = {};
      
      const stopWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', '的', '了', '是'];
      
      words.forEach(word => {
        if (word.length > 2 && !stopWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      const keywords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
      
      result.keywords = keywords;
    }
    
    if (analysisTypes.includes('topics')) {
      // 模拟主题识别
      result.topics = ['这只是一个示例，实际应用需要更复杂的主题建模'];
    }
    
    // 返回结果
    return res.json({
      jsonrpc: '2.0',
      id: req.body.id || Math.random().toString(36).substring(2, 9),
      result
    });
  } catch (error) {
    console.error('文本分析错误:', error);
    return res.status(500).json({
      error: {
        code: 500,
        message: '服务器内部错误'
      }
    });
  }
});

// 服务器健康检查
app.get('/api/mcp/text-processor/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: textProcessingServer.version
  });
});

// 服务器元数据
app.get('/api/mcp/text-processor/metadata', (req: Request, res: Response) => {
  res.json(textProcessingServer);
});

// 启动服务器
const PORT = process.env.PORT || 3100;

export const startServer = () => {
  return app.listen(PORT, () => {
    console.log(`MCP文本处理服务器运行在端口 ${PORT}`);
    console.log(`服务器版本: ${textProcessingServer.version}`);
    console.log(`服务器URL: ${textProcessingServer.url}`);
  });
};

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  startServer();
}

export default app; 