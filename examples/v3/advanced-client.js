/**
 * MCPM 3.0 高级客户端示例
 * 
 * 本示例展示了如何使用 MCPM 3.0 客户端 API 调用服务器工具，包括：
 * - 动态工具代理
 * - 错误处理
 * - 缓存管理
 * - 重试机制
 */

const { v3 } = require('../..');
const { MCPClient } = v3.client;

// 创建全局客户端实例，连接到示例服务器
const client = new MCPClient({
  server: 'http://localhost:3100',  // 高级示例服务器的地址
  credentials: 'test-key-1',        // API密钥
  autoDiscovery: true,              // 自动发现服务工具
  cacheStrategy: 'memory',          // 使用内存缓存
  cacheTTL: 300000,                 // 缓存5分钟
  retry: {
    maxRetries: 3,                  // 最多重试3次
    delay: 1000,                    // 初始延迟1秒
    factor: 2                       // 指数退避因子
  },
  debug: true                       // 启用调试日志
});

// 使用客户端调用服务器工具
async function runExample() {
  console.log('===== MCPM 3.0 客户端示例 =====\n');
  
  try {
    // 1. 连接到服务器并发现可用工具
    console.log('连接到服务器...');
    const metadata = await client.connect();
    console.log(`成功连接到 ${metadata.name} v${metadata.version}`);
    console.log(`可用工具: ${metadata.tools.map(t => t.name).join(', ')}\n`);
    
    // 2. 使用文本分析工具
    console.log('调用文本分析工具...');
    try {
      const textResult = await client.tools.textAnalysis({
        text: "人工智能正在迅速发展，为各行各业带来了深刻的变革。机器学习和深度学习等技术使计算机能够从数据中学习并做出决策。",
        language: "zh",
        options: {
          includeSentiment: true,
          includeKeywords: true,
          includeStatistics: true
        }
      });
      
      console.log('文本分析结果:');
      if (textResult.sentiment) {
        console.log(`- 情感分析: ${textResult.sentiment.label} (得分: ${textResult.sentiment.score.toFixed(2)})`);
      }
      
      if (textResult.keywords && textResult.keywords.length > 0) {
        console.log(`- 关键词: ${textResult.keywords.join(', ')}`);
      }
      
      if (textResult.statistics) {
        const stats = textResult.statistics;
        console.log(`- 统计信息: ${stats.characterCount} 字符, ${stats.wordCount} 词, ${stats.sentenceCount} 句`);
      }
    } catch (error) {
      console.error('文本分析失败:', error.message);
    }
    
    console.log();
    
    // 3. 使用图像处理工具
    console.log('调用图像处理工具...');
    try {
      const imageResult = await client.tools.imageProcessor({
        imageUrl: 'https://example.com/sample-image.jpg',
        operations: [
          {
            type: 'resize',
            params: {
              width: 800,
              height: 600,
              maintainAspectRatio: true
            }
          },
          {
            type: 'filter',
            params: {
              name: 'sepia',
              intensity: 0.7
            }
          }
        ]
      });
      
      console.log('图像处理结果:');
      console.log(`- 处理后的图像URL: ${imageResult.processedImageUrl}`);
      console.log(`- 应用的操作: ${imageResult.operations.length}`);
      
      // 展示各操作结果
      imageResult.operations.forEach((op, index) => {
        console.log(`  操作 #${index + 1}: ${op.type} - ${op.success ? '成功' : '失败'}`);
        if (op.type === 'resize' && op.dimensions) {
          console.log(`    新尺寸: ${op.dimensions.width}x${op.dimensions.height}`);
        }
        if (op.type === 'filter' && op.filter) {
          console.log(`    应用滤镜: ${op.filter}`);
        }
      });
    } catch (error) {
      console.error('图像处理失败:', error.message);
    }
    
    console.log();
    
    // 4. 使用数据转换工具
    console.log('调用数据转换工具...');
    try {
      const dataResult = await client.tools.dataTransform({
        data: {
          users: [
            { id: 1, name: "张三", age: 30 },
            { id: 2, name: "李四", age: 25 },
            { id: 3, name: "王五", age: 40 }
          ],
          metadata: {
            count: 3,
            source: "示例数据"
          }
        },
        sourceFormat: 'json',
        targetFormat: 'yaml',
        options: {
          pretty: true
        }
      });
      
      console.log('数据转换结果:');
      console.log(`- 源格式: ${dataResult.sourceFormat}`);
      console.log(`- 目标格式: ${dataResult.targetFormat}`);
      console.log(`- 转换成功: ${dataResult.converted}`);
      
      if (dataResult.formattedSample) {
        console.log('- 格式化样本:');
        console.log(`${dataResult.formattedSample}`);
      }
    } catch (error) {
      console.error('数据转换失败:', error.message);
    }
    
    console.log();
    
    // 5. 批量操作示例
    console.log('执行批量操作...');
    try {
      // 并行调用多个工具
      const [textResult2, dataResult2] = await Promise.all([
        client.tools.textAnalysis({
          text: "The quick brown fox jumps over the lazy dog. This is an example sentence for analysis.",
          language: "en"
        }),
        client.tools.dataTransform({
          data: { name: "test", value: 123 },
          sourceFormat: "json",
          targetFormat: "xml"
        })
      ]);
      
      console.log('批量操作完成:');
      console.log(`- 文本分析关键词: ${textResult2.keywords ? textResult2.keywords.join(', ') : 'none'}`);
      console.log(`- 数据转换目标格式: ${dataResult2.targetFormat}`);
    } catch (error) {
      console.error('批量操作失败:', error.message);
    }
    
    console.log();
    
    // 6. 直接调用工具（不使用代理）
    console.log('直接调用工具...');
    try {
      const result = await client.callTool('textAnalysis', {
        text: "这是一个直接调用工具的示例。",
        language: "zh"
      });
      
      console.log('直接调用结果:');
      console.log(`- 成功: ${result.success}`);
      if (result.data) {
        if (result.data.keywords) {
          console.log(`- 关键词: ${result.data.keywords.join(', ')}`);
        }
        if (result.data.statistics) {
          console.log(`- 字符数: ${result.data.statistics.characterCount}`);
        }
      }
      if (result.metadata) {
        console.log(`- 执行时间: ${result.metadata.executionTime}ms`);
      }
    } catch (error) {
      console.error('直接调用失败:', error.message);
    }
    
    console.log();
    
    // 7. 缓存管理
    console.log('测试缓存...');
    console.log('- 第一次调用(未缓存)...');
    const startTime1 = Date.now();
    await client.tools.textAnalysis({ text: "测试缓存的示例文本", language: "zh" });
    console.log(`  耗时: ${Date.now() - startTime1}ms`);
    
    console.log('- 第二次调用(应使用缓存)...');
    const startTime2 = Date.now();
    await client.tools.textAnalysis({ text: "测试缓存的示例文本", language: "zh" });
    console.log(`  耗时: ${Date.now() - startTime2}ms`);
    
    console.log('- 清除缓存...');
    client.clearCache();
    
    console.log('- 第三次调用(清除缓存后)...');
    const startTime3 = Date.now();
    await client.tools.textAnalysis({ text: "测试缓存的示例文本", language: "zh" });
    console.log(`  耗时: ${Date.now() - startTime3}ms`);
    
  } catch (error) {
    console.error('示例运行出错:', error);
  } finally {
    // 关闭客户端
    console.log('\n关闭客户端...');
    client.close();
    console.log('示例完成!');
  }
}

// 运行示例
console.log('开始运行客户端示例...');
runExample().catch(error => {
  console.error('客户端示例失败:', error);
  process.exit(1);
}); 