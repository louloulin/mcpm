"use client";

import { useState } from 'react';
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code, Terminal, FileCode, ChevronRight, AlertCircle } from 'lucide-react';

export default function DevGuidePage() {
  const [activeTab, setActiveTab] = useState("basics");

  return (
    <div className="container mx-auto py-12">
      <div className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold">MCP 开发指南</h1>
        <p className="text-xl text-muted-foreground">学习如何构建和扩展您的MCP服务</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">目录</p>
              <div className="space-y-1 text-sm">
                <a href="#prerequisites" className="block py-1 text-muted-foreground hover:text-primary">准备工作</a>
                <a href="#architecture" className="block py-1 text-muted-foreground hover:text-primary">架构概述</a>
                <a href="#quickstart" className="block py-1 text-muted-foreground hover:text-primary">快速开始</a>
                <a href="#api-development" className="block py-1 text-muted-foreground hover:text-primary">API开发</a>
                <a href="#authentication" className="block py-1 text-muted-foreground hover:text-primary">身份验证</a>
                <a href="#deployment" className="block py-1 text-muted-foreground hover:text-primary">部署指南</a>
                <a href="#best-practices" className="block py-1 text-muted-foreground hover:text-primary">最佳实践</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-xl">
              <TabsTrigger value="basics">基础知识</TabsTrigger>
              <TabsTrigger value="advanced">高级功能</TabsTrigger>
              <TabsTrigger value="examples">示例代码</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-8">
              <section id="prerequisites" className="space-y-4">
                <h2 className="text-2xl font-bold">准备工作</h2>
                <Separator className="my-2" />
                <p>开始构建MCP服务前，确保你的开发环境已准备好以下内容：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Terminal className="h-5 w-5 mr-2" />
                        开发环境
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Node.js 18+ 或 Python 3.9+</li>
                        <li>包管理器（npm, pnpm, pip）</li>
                        <li>Git</li>
                        <li>代码编辑器（VS Code推荐）</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Code className="h-5 w-5 mr-2" />
                        知识准备
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Web API开发基础</li>
                        <li>JSON Schema理解</li>
                        <li>基本的HTTP协议知识</li>
                        <li>异步编程概念</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section id="architecture" className="space-y-4">
                <h2 className="text-2xl font-bold">架构概述</h2>
                <Separator className="my-2" />
                <p>MCP（Model Control Protocol）服务的典型架构包括：</p>
                
                <div className="bg-muted/30 p-6 rounded-lg border my-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium">API层</h3>
                      <p className="text-sm text-muted-foreground">处理HTTP请求响应</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium">服务层</h3>
                      <p className="text-sm text-muted-foreground">业务逻辑实现</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium">数据层</h3>
                      <p className="text-sm text-muted-foreground">持久化和状态管理</p>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <div className="bg-blue-100 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900 w-full md:w-2/3 text-center">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300">MCP协议接口</h3>
                      <p className="text-sm text-blue-700/80 dark:text-blue-400/80">标准化AI工具交互</p>
                    </div>
                  </div>
                </div>

                <p className="mt-4">
                  MCP服务通过标准化的接口与AI模型和客户端交互，支持工具注册、执行和结果返回。
                </p>
              </section>

              <section id="quickstart" className="space-y-4">
                <h2 className="text-2xl font-bold">快速开始</h2>
                <Separator className="my-2" />
                
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>提示</AlertTitle>
                  <AlertDescription>
                    使用我们的模板可以快速创建一个基本的MCP服务。
                  </AlertDescription>
                </Alert>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="nodejs">
                    <AccordionTrigger>Node.js快速启动</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">1. 创建项目并安装依赖：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`pnpm init
pnpm add express @mastra/core @mastra/client-js`}</code>
                        </pre>
                        
                        <p className="text-sm">2. 创建服务器文件(server.js)：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`const express = require('express');
const { createToolProvider } = require('@mastra/core');

const app = express();
app.use(express.json());

// 创建工具提供者
const toolProvider = createToolProvider({
  tools: [
    {
      name: 'hello',
      description: '返回问候消息',
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
        return { message: \`你好，\${name}！\` };
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

app.listen(3000, () => {
  console.log('MCP服务已启动在 http://localhost:3000');
});`}</code>
                        </pre>
                        
                        <p className="text-sm">3. 启动服务器：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`node server.js`}</code>
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="python">
                    <AccordionTrigger>Python快速启动</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">1. 安装依赖：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`pip install fastapi uvicorn mastra-py`}</code>
                        </pre>
                        
                        <p className="text-sm">2. 创建服务器文件(app.py)：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mastra import ToolProvider, Tool, ToolParameters

app = FastAPI()

# 定义工具参数
class HelloParams(BaseModel):
    name: str

# 创建工具提供者
tool_provider = ToolProvider([
    Tool(
        name="hello",
        description="返回问候消息",
        parameters=ToolParameters(
            properties={
                "name": {
                    "type": "string",
                    "description": "要问候的名称"
                }
            },
            required=["name"]
        ),
        handler=lambda params: {"message": f"你好，{params['name']}！"}
    )
])

@app.get("/tools")
async def list_tools():
    return tool_provider.list_tools()

@app.post("/execute")
async def execute_tool(request: dict):
    try:
        result = await tool_provider.execute_tool(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=3000, reload=True)`}</code>
                        </pre>
                        
                        <p className="text-sm">3. 启动服务器：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`python app.py`}</code>
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-8">
              <section id="api-development" className="space-y-4">
                <h2 className="text-2xl font-bold">API开发</h2>
                <Separator className="my-2" />
                
                <p>MCP服务的核心是定义和实现符合协议的API端点。以下是主要的API开发内容：</p>
                
                <div className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>工具定义与注册</CardTitle>
                      <CardDescription>如何定义和注册MCP工具</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        每个MCP工具需要定义名称、描述、参数模式和处理函数。参数模式应遵循JSON Schema格式。
                      </p>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                        <code>{`// 工具定义示例
{
  name: "calculate",
  description: "执行数学计算",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "数学表达式"
      }
    },
    required: ["expression"]
  },
  handler: async ({ expression }) => {
    // 计算逻辑实现
    const result = evaluateExpression(expression);
    return { result };
  }
}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>请求验证与处理</CardTitle>
                      <CardDescription>如何验证和处理客户端请求</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        MCP服务需要验证接收的请求符合工具的参数模式，并正确处理请求数据。
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">请求验证</p>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>检查必需参数</li>
                            <li>验证参数类型</li>
                            <li>应用自定义验证逻辑</li>
                            <li>提供清晰的错误消息</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">异常处理</p>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>捕获执行错误</li>
                            <li>提供有意义的错误响应</li>
                            <li>记录详细的错误日志</li>
                            <li>优雅处理超时和失败</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section id="authentication" className="space-y-4">
                <h2 className="text-2xl font-bold">身份验证</h2>
                <Separator className="my-2" />
                
                <p>为MCP服务添加身份验证可以保护API免受未授权访问，常见的身份验证方式包括：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>API密钥认证</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        通过请求头或查询参数传递API密钥进行认证，适用于服务器到服务器通信。
                      </p>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto mt-4">
                        <code>{`// API密钥中间件示例
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({
      error: "无效的API密钥"
    });
  }
  
  next();
}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>JWT认证</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        使用JWT令牌进行无状态认证，支持用户身份和权限验证。
                      </p>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto mt-4">
                        <code>{`// JWT验证中间件示例
function jwtAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: "未提供认证令牌"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "无效的认证令牌"
    });
  }
}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="examples" className="space-y-8">
              <section id="best-practices" className="space-y-4">
                <h2 className="text-2xl font-bold">示例代码和最佳实践</h2>
                <Separator className="my-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        天气查询服务
                      </CardTitle>
                      <CardDescription>集成第三方API</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        展示如何创建一个连接天气API的MCP服务，处理API密钥、请求缓存和错误处理。
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        <Link href="/docs/examples/weather">
                          <span className="flex items-center justify-center">
                            查看示例 <ChevronRight className="h-4 w-4 ml-1" />
                          </span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        文件处理服务
                      </CardTitle>
                      <CardDescription>处理文件上传和下载</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        展示如何在MCP中处理文件上传、处理和下载，包括进度跟踪和大文件处理。
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        <Link href="/docs/examples/files">
                          <span className="flex items-center justify-center">
                            查看示例 <ChevronRight className="h-4 w-4 ml-1" />
                          </span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        数据库集成
                      </CardTitle>
                      <CardDescription>与数据库交互</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        展示如何将MCP服务连接到数据库，处理查询、事务和数据验证。
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        <Link href="/docs/examples/database">
                          <span className="flex items-center justify-center">
                            查看示例 <ChevronRight className="h-4 w-4 ml-1" />
                          </span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">最佳实践</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>性能优化</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>实现请求缓存减少重复计算</li>
                          <li>使用异步处理避免阻塞</li>
                          <li>优化大型响应的处理方式</li>
                          <li>合理设置超时和重试策略</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>安全建议</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>验证和净化所有输入数据</li>
                          <li>实施速率限制防止滥用</li>
                          <li>使用HTTPS加密传输</li>
                          <li>定期审计和更新依赖项</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              <section id="deployment" className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold">部署指南</h2>
                <Separator className="my-2" />
                
                <p>将你的MCP服务部署到生产环境的指南：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Docker部署</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        使用Docker容器化MCP服务，确保环境一致性和简化部署流程。
                      </p>
                      <Button variant="link" className="px-0 mt-2" asChild>
                        <Link href="/docs/deployment/docker">查看详细指南</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>云服务部署</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        部署到AWS、Azure或GCP等云服务提供商，利用其弹性和可靠性。
                      </p>
                      <Button variant="link" className="px-0 mt-2" asChild>
                        <Link href="/docs/deployment/cloud">查看详细指南</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>无服务器部署</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        使用AWS Lambda、Vercel或Netlify部署MCP服务，减少运维负担。
                      </p>
                      <Button variant="link" className="px-0 mt-2" asChild>
                        <Link href="/docs/deployment/serverless">查看详细指南</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4">相关资源</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/docs/api">API文档</Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/docs/examples">代码示例</Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/docs/faq">常见问题</Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/docs/community">社区资源</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 