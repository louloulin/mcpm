/**
 * MCP集成SDK - AI助手集成示例
 * 
 * 这个示例展示了如何在AI助手中使用MCP集成SDK
 */

import { 
  AIAssistantClient, 
  ToolDefinition, 
  ToolCallRequest, 
  SessionContext 
} from '../integrations/ai';

// 配置信息
const config = {
  serverUrl: 'https://mcp-server.example.com',
  apiKey: 'mcp_abcdef1234567890abcdef1234567890',
  assistant: {
    name: 'MCP AI Assistant',
    version: '1.0.0',
    assistantType: 'chatbot' as const,
    capabilities: ['code-generation', 'debugging', 'knowledge-retrieval'],
    telemetryEnabled: true
  }
};

// 会话上下文
const session: SessionContext = {
  sessionId: `session-${Date.now()}`,
  userId: 'user-123',
  metadata: {
    clientType: 'web',
    clientVersion: '2.5.0',
    locale: 'zh-CN'
  }
};

/**
 * 初始化AI助手集成
 */
async function setupAIAssistantIntegration() {
  try {
    console.log('初始化AI助手集成...');
    
    // 创建AI助手集成客户端
    const client = new AIAssistantClient(
      {
        baseUrl: config.serverUrl,
        apiKey: config.apiKey
      },
      config.assistant
    );
    
    // 验证API密钥
    const isValid = await client.verifyApiKey();
    if (!isValid) {
      console.error('API密钥验证失败，请检查配置');
      return null;
    }
    
    console.log('API密钥验证成功');
    
    // 注册AI助手
    const registered = await client.registerAssistant();
    if (!registered) {
      console.error('注册AI助手失败');
      return null;
    }
    
    console.log('AI助手注册成功');
    
    return client;
  } catch (error) {
    console.error('AI助手集成初始化失败:', error);
    return null;
  }
}

/**
 * 获取并显示可用工具
 * @param client AI助手集成客户端
 * @param serverKey 服务器Key
 */
async function getAndDisplayTools(client: AIAssistantClient, serverKey: string) {
  try {
    console.log(`获取服务器 ${serverKey} 的可用工具...`);
    
    // 获取工具列表
    const tools = await client.getAvailableTools(serverKey);
    
    if (tools.length === 0) {
      console.log('没有可用的工具');
      return [];
    }
    
    console.log(`获取到${tools.length}个工具`);
    
    // 显示工具列表
    displayTools(tools);
    
    return tools;
  } catch (error) {
    console.error('获取工具列表失败:', error);
    return [];
  }
}

/**
 * 显示工具列表
 * @param tools 工具定义数组
 */
function displayTools(tools: ToolDefinition[]) {
  console.log('\n--- 可用工具 ---');
  
  tools.forEach((tool, index) => {
    console.log(`\n[${index + 1}] ${tool.name}`);
    console.log(`描述: ${tool.description}`);
    console.log(`必需参数: ${tool.required_parameters?.join(', ') || '无'}`);
    console.log(`参数定义: ${JSON.stringify(tool.parameters, null, 2)}`);
  });
}

/**
 * 创建工具调用请求
 * @param tool 工具定义
 * @param inputs 用户输入参数
 */
function createToolCallRequest(tool: ToolDefinition, inputs: Record<string, any>): ToolCallRequest {
  return {
    toolName: tool.name,
    parameters: inputs,
    callId: `call-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  };
}

/**
 * 调用工具示例
 * @param client AI助手集成客户端
 * @param serverKey 服务器Key
 * @param tools 可用工具
 */
async function callToolExample(client: AIAssistantClient, serverKey: string, tools: ToolDefinition[]) {
  // 检查是否有可用工具
  if (tools.length === 0) {
    return;
  }
  
  try {
    // 选择第一个工具作为示例
    const tool = tools[0];
    
    console.log(`\n调用工具示例: ${tool.name}`);
    
    // 示例输入参数（实际应用中应匹配工具参数定义）
    const inputs = {
      query: "如何使用MCP集成SDK?",
      max_results: 5
    };
    
    // 创建工具调用请求
    const request = createToolCallRequest(tool, inputs);
    
    console.log(`发送工具调用请求: ${JSON.stringify(request, null, 2)}`);
    
    // 调用工具
    const response = await client.callTool(serverKey, request, session);
    
    console.log(`\n工具调用响应: ${JSON.stringify(response, null, 2)}`);
    
    // 发送使用情况统计
    await client.sendUsageStats({
      action: 'tool_call',
      toolName: tool.name,
      success: !response.error,
      latency: 150, // 假设的延迟时间(ms)
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('工具调用示例失败:', error);
  }
}

/**
 * 获取模型配置
 * @param client AI助手集成客户端
 * @param serverKey 服务器Key
 */
async function getModelConfig(client: AIAssistantClient, serverKey: string) {
  try {
    console.log(`\n获取服务器 ${serverKey} 的模型配置...`);
    
    const config = await client.getModelConfig(serverKey);
    
    console.log(`模型配置: ${JSON.stringify(config, null, 2)}`);
  } catch (error) {
    console.error('获取模型配置失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  // 初始化客户端
  const client = await setupAIAssistantIntegration();
  if (!client) {
    return;
  }
  
  const serverKey = 'server1';
  
  // 获取并显示工具
  const tools = await getAndDisplayTools(client, serverKey);
  
  // 调用工具示例
  await callToolExample(client, serverKey, tools);
  
  // 获取模型配置
  await getModelConfig(client, serverKey);
  
  console.log('\nAI助手集成示例完成');
}

// 运行主函数
main().catch(console.error); 