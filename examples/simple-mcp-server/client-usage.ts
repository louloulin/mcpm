/**
 * MCP文本处理服务客户端使用示例
 */

import fetch from 'node-fetch';

// 服务器地址
const SERVER_URL = 'http://localhost:3100/api/mcp/text-processor';

// API密钥（在实际应用中应从安全存储获取）
const API_KEY = 'demo-api-key';

// MCP调用基础函数
async function callMCPServer(endpoint: string, params: any) {
  try {
    const response = await fetch(`${SERVER_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        id: Math.random().toString(36).substring(2, 9),
        ...params
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API错误: ${errorData.error.message || '未知错误'}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`调用MCP服务器错误 (${endpoint}):`, error);
    throw error;
  }
}

// 摘要生成功能
async function generateSummary(text: string, maxLength = 100) {
  return callMCPServer('summarize', { text, maxLength });
}

// 文本翻译功能
async function translateText(text: string, targetLanguage: string, sourceLanguage = 'auto') {
  return callMCPServer('translate', { text, targetLanguage, sourceLanguage });
}

// 文本分析功能
async function analyzeText(text: string, analysisTypes = ['sentiment', 'keywords']) {
  return callMCPServer('analyze', { text, analysisTypes });
}

// 使用示例
async function runExamples() {
  console.log('=== MCP文本处理服务器客户端示例 ===\n');
  
  try {
    // 示例1: 摘要生成
    console.log('示例1: 摘要生成');
    const longText = `人工智能(AI)是计算机科学的一个分支，致力于创建能够模仿人类智能的系统。
    它包括机器学习、自然语言处理、计算机视觉等多个领域。近年来，AI技术迅速发展，
    已经应用于医疗诊断、自动驾驶、语言翻译等众多领域，极大地改变了人们的生活和工作方式。
    尽管AI带来了许多便利，但也引发了关于隐私、安全和伦理等方面的担忧，
    需要社会各界共同努力，确保AI技术的发展符合人类的长远利益。`;
    
    const summaryResult = await generateSummary(longText, 20);
    console.log('原文长度:', longText.length, '字符');
    console.log('摘要结果:', summaryResult.result.summary);
    console.log('摘要长度:', summaryResult.result.summaryLength, '字符');
    console.log('\n');
    
    // 示例2: 文本翻译
    console.log('示例2: 文本翻译');
    const textToTranslate = '人工智能正在改变世界';
    
    const translationResult = await translateText(textToTranslate, 'en', 'zh');
    console.log('原文:', textToTranslate);
    console.log('翻译结果:', translationResult.result.translation);
    console.log('\n');
    
    // 示例3: 文本分析
    console.log('示例3: 文本分析');
    const textToAnalyze = 'I really love this new artificial intelligence technology. It is amazing and helpful, though sometimes it can be confusing and frustrating.';
    
    const analysisResult = await analyzeText(textToAnalyze, ['sentiment', 'keywords']);
    console.log('文本:', textToAnalyze);
    console.log('情感分析:', analysisResult.result.sentiment);
    console.log('关键词:', analysisResult.result.keywords);
    console.log('\n');
    
    console.log('=== 所有示例执行完成 ===');
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runExamples();
}

export {
  generateSummary,
  translateText,
  analyzeText,
  runExamples
}; 