"use client";

import { useState } from 'react';
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileCode, Terminal, ArrowRight, Check, Copy, ExternalLink } from 'lucide-react';

export default function QuickstartPage() {
  const [activeTab, setActiveTab] = useState("installation");
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-12">
      <div className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold">MCP 快速入门</h1>
        <p className="text-xl text-muted-foreground">快速上手使用MCP构建和部署AI工具</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">目录</p>
              <div className="space-y-1 text-sm">
                <a href="#prerequisites" className="block py-1 text-muted-foreground hover:text-primary">前置条件</a>
                <a href="#installation" className="block py-1 text-muted-foreground hover:text-primary">安装指南</a>
                <a href="#first-tool" className="block py-1 text-muted-foreground hover:text-primary">创建第一个工具</a>
                <a href="#testing" className="block py-1 text-muted-foreground hover:text-primary">测试与调试</a>
                <a href="#deployment" className="block py-1 text-muted-foreground hover:text-primary">部署到生产</a>
                <a href="#next-steps" className="block py-1 text-muted-foreground hover:text-primary">后续步骤</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-xl">
              <TabsTrigger value="installation">安装指南</TabsTrigger>
              <TabsTrigger value="first-steps">第一步</TabsTrigger>
              <TabsTrigger value="examples">示例代码</TabsTrigger>
            </TabsList>

            <TabsContent value="installation" className="space-y-8">
              <section id="prerequisites" className="space-y-4">
                <h2 className="text-2xl font-bold">前置条件</h2>
                <Separator className="my-2" />
                <p>在开始使用MCP之前，请确保您已准备好以下内容：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Terminal className="h-5 w-5 mr-2" />
                        基本环境
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Node.js 18+ 或 Python 3.9+</li>
                        <li>包管理器（npm, pnpm, pip）</li>
                        <li>基本的命令行工具使用经验</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        开发工具
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>代码编辑器（推荐VS Code）</li>
                        <li>Git（用于版本控制）</li>
                        <li>API测试工具（可选，如Postman）</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section id="installation" className="space-y-4">
                <h2 className="text-2xl font-bold">安装指南</h2>
                <Separator className="my-2" />
                
                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="node-js">
                    <AccordionTrigger>Node.js 安装</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">1. 创建项目目录：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`mkdir my-mcp-project
cd my-mcp-project`}</code>
                        </pre>
                        
                        <p className="text-sm">2. 初始化项目：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`npm init -y`}</code>
                        </pre>
                        
                        <p className="text-sm">3. 安装MCP核心包：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`npm install @mastra/core @mastra/client-js express`}</code>
                        </pre>

                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" onClick={() => copyToClipboard("npm install @mastra/core @mastra/client-js express")}>
                            <Copy className="h-4 w-4 mr-2" />
                            复制命令
                          </Button>
                          <p className="text-xs text-muted-foreground">或使用pnpm/yarn</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="python">
                    <AccordionTrigger>Python 安装</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">1. 创建并激活虚拟环境（推荐）：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`python -m venv venv
# Windows
venv\\Scripts\\activate
# macOS/Linux
source venv/bin/activate`}</code>
                        </pre>
                        
                        <p className="text-sm">2. 安装MCP Python包：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`pip install mastra-py fastapi uvicorn`}</code>
                        </pre>

                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" onClick={() => copyToClipboard("pip install mastra-py fastapi uvicorn")}>
                            <Copy className="h-4 w-4 mr-2" />
                            复制命令
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="template">
                    <AccordionTrigger>使用模板快速安装</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">使用我们的官方模板快速创建一个完整的MCP项目：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`# Node.js/Express 模板
npx create-mcp-app my-mcp-project

# 或者指定模板
npx create-mcp-app my-mcp-project --template express`}</code>
                        </pre>

                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" onClick={() => copyToClipboard("npx create-mcp-app my-mcp-project")}>
                            <Copy className="h-4 w-4 mr-2" />
                            复制命令
                          </Button>
                        </div>
                        
                        <p className="text-sm mt-4">更多模板信息，请参阅：</p>
                        <Button variant="link" size="sm" asChild className="p-0">
                          <Link href="/docs/dev/templates">
                            模板文档
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </TabsContent>

            <TabsContent value="first-steps" className="space-y-8">
              <section id="first-tool" className="space-y-4">
                <h2 className="text-2xl font-bold">创建第一个工具</h2>
                <Separator className="my-2" />
                
                <p>下面我们将创建一个简单的MCP工具，该工具接收一个名称参数并返回一个问候消息：</p>
                
                <Tabs defaultValue="node" className="w-full mt-4">
                  <TabsList>
                    <TabsTrigger value="node">Node.js</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="node" className="mt-4 space-y-4">
                    <p className="text-sm">创建一个名为 <code>server.js</code> 的文件：</p>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                      <code>{`const express = require('express');
const { createToolProvider } = require('@mastra/core');

const app = express();
app.use(express.json());

// 创建工具提供者
const toolProvider = createToolProvider({
  tools: [
    {
      name: 'greeting',
      description: '返回一个问候消息',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '要问候的名称'
          }
        },
        required: ['name']
      },
      handler: async ({ name }) => {
        return { message: \`你好，\${name}！欢迎使用MCP。\` };
      }
    }
  ]
});

// 注册MCP端点
app.get('/tools', (req, res) => {
  res.json(toolProvider.listTools());
});

app.post('/execute', async (req, res) => {
  try {
    const result = await toolProvider.executeTool(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`MCP服务已启动在 http://localhost:\${PORT}\`);
});`}</code>
                    </pre>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Button size="sm" onClick={() => copyToClipboard("node server.js")}>
                        <Copy className="h-4 w-4 mr-2" />
                        启动命令
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="python" className="mt-4 space-y-4">
                    <p className="text-sm">创建一个名为 <code>app.py</code> 的文件：</p>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                      <code>{`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mastra import ToolProvider, Tool, ToolParameters

app = FastAPI()

# 定义工具参数
class GreetingParams(BaseModel):
    name: str

# 创建工具提供者
tool_provider = ToolProvider([
    Tool(
        name="greeting",
        description="返回一个问候消息",
        parameters=ToolParameters(
            properties={
                "name": {
                    "type": "string",
                    "description": "要问候的名称"
                }
            },
            required=["name"]
        ),
        handler=lambda params: {"message": f"你好，{params['name']}！欢迎使用MCP。"}
    )
])

@app.get("/tools")
async def list_tools():
    return tool_provider.list_tools()

@app.post("/execute")
async def execute_tool(request: dict):
    try:
        return await tool_provider.execute_tool(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 启动服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)`}</code>
                    </pre>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Button size="sm" onClick={() => copyToClipboard("uvicorn app:app --reload --port 3000")}>
                        <Copy className="h-4 w-4 mr-2" />
                        启动命令
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              <section id="testing" className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold">测试与调试</h2>
                <Separator className="my-2" />
                
                <p>启动服务器后，您可以通过以下方式测试您的工具：</p>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>使用cURL测试</CardTitle>
                    <CardDescription>通过命令行直接测试API</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">1. 列出可用工具：</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      <code>{`curl http://localhost:3000/tools`}</code>
                    </pre>
                    
                    <p className="text-sm mt-4 mb-2">2. 执行问候工具：</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      <code>{`curl -X POST http://localhost:3000/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "greeting",
    "parameters": {
      "name": "张三"
    }
  }'`}</code>
                    </pre>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>使用客户端库测试</CardTitle>
                    <CardDescription>通过JavaScript客户端库测试</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">创建一个测试脚本 <code>test-client.js</code>：</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      <code>{`const { createMCPClient } = require('@mastra/client-js');

async function testGreeting() {
  // 创建客户端实例
  const client = createMCPClient({
    baseUrl: 'http://localhost:3000'
  });
  
  // 获取可用工具列表
  const tools = await client.listTools();
  console.log('可用工具:', tools);
  
  // 执行问候工具
  const result = await client.executeTool({
    name: 'greeting',
    parameters: {
      name: '张三'
    }
  });
  
  console.log('执行结果:', result);
}

testGreeting().catch(console.error);`}</code>
                    </pre>
                    
                    <p className="text-sm mt-4">运行测试脚本：</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      <code>{`node test-client.js`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="examples" className="space-y-8">
              <section id="deployment" className="space-y-4">
                <h2 className="text-2xl font-bold">部署到生产</h2>
                <Separator className="my-2" />
                
                <p>当您准备将MCP服务部署到生产环境时，可以考虑以下选项：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ExternalLink className="h-5 w-5 mr-2" />
                        云服务提供商
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>AWS Lambda + API Gateway</li>
                        <li>Google Cloud Functions</li>
                        <li>Azure Functions</li>
                        <li>Vercel Serverless Functions</li>
                      </ul>
                      <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                        <Link href="/docs/deployment">
                          查看部署文档
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Terminal className="h-5 w-5 mr-2" />
                        容器化部署
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Docker容器</li>
                        <li>Kubernetes集群</li>
                        <li>容器托管服务 (ECS, GKE)</li>
                      </ul>
                      <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                        <Link href="/docs/mcp/container">
                          容器化指南
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  <AlertTitle>生产环境注意事项</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
                      <li>确保实施适当的身份验证和授权</li>
                      <li>配置HTTPS和安全头信息</li>
                      <li>考虑配置环境变量和秘钥管理</li>
                      <li>设置日志记录和监控</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </section>

              <section id="next-steps" className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold">后续步骤</h2>
                <Separator className="my-2" />
                
                <p>恭喜！您已经成功创建并测试了第一个MCP工具。以下是一些后续步骤建议：</p>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">探索更多工具类型</h3>
                      <p className="text-sm text-muted-foreground">学习如何创建不同类型的工具，例如文本处理、数据分析或API集成工具。</p>
                      <Button variant="link" size="sm" className="mt-1 p-0" asChild>
                        <Link href="/docs/dev/guide">
                          开发者指南
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">集成AI模型</h3>
                      <p className="text-sm text-muted-foreground">了解如何将您的MCP工具与大型语言模型集成，实现更强大的AI功能。</p>
                      <Button variant="link" size="sm" className="mt-1 p-0" asChild>
                        <Link href="/docs/concepts">
                          核心概念
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">浏览示例项目</h3>
                      <p className="text-sm text-muted-foreground">查看我们的示例库，获取更多灵感和最佳实践。</p>
                      <Button variant="link" size="sm" className="mt-1 p-0" asChild>
                        <Link href="https://github.com/mastra-ai/examples" target="_blank">
                          示例仓库
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 