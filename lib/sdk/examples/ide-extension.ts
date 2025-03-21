/**
 * MCP集成SDK - IDE扩展示例
 * 
 * 这个示例展示了如何在IDE扩展中使用MCP集成SDK
 */

import { IDEIntegrationClient, CodeSnippet } from '../integrations/ide';

// 配置信息
const config = {
  serverUrl: 'https://mcp-server.example.com',
  apiKey: 'mcp_abcdef1234567890abcdef1234567890',
  extension: {
    name: 'MCP VSCode Extension',
    version: '1.0.0',
    ideType: 'vscode' as const,
    features: ['code-completion', 'diagnostics', 'refactoring'],
    telemetryEnabled: true
  },
  notifications: {
    enabled: true,
    pollingIntervalSeconds: 300, // 5分钟
    showUpdatePrompt: true,
    autoUpdate: false
  }
};

/**
 * 初始化与MCP服务器的集成
 */
async function setupMCPIntegration() {
  try {
    console.log('初始化MCP集成...');
    
    // 创建IDE集成客户端
    const client = new IDEIntegrationClient(
      {
        baseUrl: config.serverUrl,
        apiKey: config.apiKey
      },
      config.extension,
      config.notifications
    );
    
    // 验证API密钥
    const isValid = await client.verifyApiKey();
    if (!isValid) {
      console.error('API密钥验证失败，请检查配置');
      return null;
    }
    
    console.log('API密钥验证成功');
    
    // 注册IDE扩展
    const registered = await client.registerExtension();
    if (!registered) {
      console.error('注册IDE扩展失败');
      return null;
    }
    
    console.log('IDE扩展注册成功');
    
    // 订阅服务器更新
    const subscribed = await client.subscribeToServerUpdates(['server1', 'server2']);
    console.log(`服务器更新订阅状态: ${subscribed ? '成功' : '失败'}`);
    
    return client;
  } catch (error) {
    console.error('MCP集成初始化失败:', error);
    return null;
  }
}

/**
 * 获取代码片段并处理
 * @param client IDE集成客户端
 * @param language 编程语言
 */
async function fetchAndProcessSnippets(client: IDEIntegrationClient, language: string) {
  try {
    console.log(`获取${language}代码片段...`);
    
    // 获取服务器提供的代码片段
    const snippets = await client.getCodeSnippets('server1', language);
    
    if (snippets.length === 0) {
      console.log(`没有可用的${language}代码片段`);
      return;
    }
    
    console.log(`获取到${snippets.length}个${language}代码片段`);
    
    // 处理代码片段
    displaySnippets(snippets);
    
    // 发送遥测数据
    await client.sendTelemetry({
      action: 'fetch_snippets',
      language,
      count: snippets.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`获取代码片段失败:`, error);
  }
}

/**
 * 显示代码片段
 * @param snippets 代码片段数组
 */
function displaySnippets(snippets: CodeSnippet[]) {
  console.log('\n--- 代码片段 ---');
  
  snippets.forEach((snippet, index) => {
    console.log(`\n[${index + 1}] ${snippet.description || '无描述'}`);
    console.log(`语言: ${snippet.language}`);
    console.log(`文件名: ${snippet.fileName || '未指定'}`);
    console.log('代码:');
    console.log('```');
    console.log(snippet.code);
    console.log('```');
  });
}

/**
 * 主函数
 */
async function main() {
  // 初始化客户端
  const client = await setupMCPIntegration();
  if (!client) {
    return;
  }
  
  // 获取不同语言的代码片段
  await fetchAndProcessSnippets(client, 'typescript');
  await fetchAndProcessSnippets(client, 'python');
  
  // 检查服务器更新
  try {
    const updates = await client.checkServerUpdates(['server1', 'server2']);
    
    for (const [serverKey, version] of Object.entries(updates)) {
      console.log(`服务器 ${serverKey} 更新到版本 ${version}`);
    }
  } catch (error) {
    console.error('检查服务器更新失败:', error);
  }
  
  console.log('\nMCP集成示例完成');
}

// 运行主函数
main().catch(console.error); 