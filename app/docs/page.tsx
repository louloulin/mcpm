"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import {
  Code, 
  Server, 
  Tool, 
  Github, 
  Play,
  ChevronRight,
  BookOpen,
  FileCode,
  TerminalSquare,
  Blocks
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("getting-started");

  return (
    <div className="container mx-auto py-12">
      <div className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold">MCP文档中心</h1>
        <p className="text-xl text-muted-foreground">学习如何使用和开发MCP服务器</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mb-6">
          <TabsTrigger value="getting-started">新手指南</TabsTrigger>
          <TabsTrigger value="api-docs">API文档</TabsTrigger>
          <TabsTrigger value="server-dev">服务器开发</TabsTrigger>
          <TabsTrigger value="use-cases">使用案例</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TerminalSquare className="h-5 w-5 text-blue-600" />
                  <CardTitle>安装指南</CardTitle>
                </div>
                <CardDescription>快速设置MCP服务器</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  了解如何在本地环境中安装和配置MCP服务器，便于开发和测试。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/installation">
                    <span className="flex items-center justify-center">
                      查看指南 <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
      <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle>基础概念</CardTitle>
        </div>
                <CardDescription>MCP核心概念介绍</CardDescription>
      </CardHeader>
      <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  了解MCP协议的核心概念、工作原理以及与AI模型的交互方式。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/concepts">
                    <span className="flex items-center justify-center">
                      查看指南 <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
              </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Blocks className="h-5 w-5 text-blue-600" />
                  <CardTitle>快速入门</CardTitle>
                </div>
                <CardDescription>MCP服务器快速上手指南</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  10分钟内构建并部署你的第一个MCP服务，包含完整代码示例。
                </p>
      </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/quickstart">
                    <span className="flex items-center justify-center">
                      查看指南 <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
    </Card>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl">
            <AccordionItem value="what-is-mcp">
              <AccordionTrigger>什么是MCP服务器？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-4">
                  MCP (Model Context Protocol) 是一个设计用于扩展AI模型能力的协议。MCP服务器提供了一种标准化的方式，使AI模型能够安全地与外部服务和数据源交互，实现更强大的功能。
                </p>
                <p className="text-muted-foreground">
                  通过MCP，AI模型可以访问实时数据、调用APIs、执行复杂计算、操作本地文件等。这大大拓展了模型的应用场景和能力范围。
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="how-it-works">
              <AccordionTrigger>MCP服务器如何工作？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-4">
                  MCP服务器作为AI模型与外部世界之间的桥梁，按照以下方式工作：
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground mb-4">
                  <li>AI模型识别需要外部帮助的任务</li>
                  <li>模型通过MCP协议发送请求到相应的MCP服务器</li>
                  <li>MCP服务器处理请求，执行需要的操作（如API调用、数据查询等）</li>
                  <li>服务器将结果返回给AI模型</li>
                  <li>AI模型将这些信息集成到其响应中</li>
                </ol>
                <p className="text-muted-foreground">
                  整个过程对用户而言是无缝的，从而提供更准确、更丰富的AI交互体验。
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="benefits">
              <AccordionTrigger>使用MCP服务器的优势</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li><span className="font-medium text-foreground">能力扩展</span>：让AI能够访问实时数据和执行外部操作</li>
                  <li><span className="font-medium text-foreground">标准化</span>：遵循统一的协议，便于集成和互操作</li>
                  <li><span className="font-medium text-foreground">安全性</span>：通过权限控制和隔离环境提供安全保障</li>
                  <li><span className="font-medium text-foreground">开发简便</span>：易于开发和部署，支持多种编程语言</li>
                  <li><span className="font-medium text-foreground">可扩展性</span>：根据需求轻松添加新功能和服务</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 max-w-3xl border border-blue-200 dark:border-blue-900">
            <div className="flex items-start mb-4">
              <Play className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <h3 className="text-lg font-medium">快速示例：使用MCP服务器</h3>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">使用Python通过pip安装MCP客户端：</p>
              <div className="bg-gray-950 text-gray-200 p-3 rounded-md text-sm font-mono overflow-x-auto">
                pip install mcp-client-py
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">基本使用示例：</p>
              <div className="bg-gray-950 text-gray-200 p-3 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{`from mcp_client import MCPClient

# 初始化MCP客户端
client = MCPClient()

# 连接到本地MCP服务器
client.connect("localhost:8080")

# 使用服务器执行操作
response = client.execute(
    tool="weather_tool", 
    params={"city": "北京", "days": 3}
)

print(response)
# 输出：{"forecast": [{...}], "status": "success"}`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api-docs" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>REST API</CardTitle>
                <CardDescription>MCP服务器HTTP API参考文档</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  完整的REST API文档，包含所有端点、参数和响应格式，适用于直接与MCP服务器集成的应用。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/api/rest">
                    查看文档
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>客户端SDK</CardTitle>
                <CardDescription>官方MCP客户端库</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  多语言SDK文档，包括Python、JavaScript、Java和Go客户端库的安装和使用指南。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/api/sdk">
                    查看文档
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">API节点列表</h3>
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 mr-2">GET</Badge>
                  <code className="text-sm font-mono">/api/v1/tools</code>
                </div>
                <p className="text-sm text-muted-foreground">获取可用工具列表及其元数据</p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 mr-2">POST</Badge>
                  <code className="text-sm font-mono">/api/v1/execute</code>
                </div>
                <p className="text-sm text-muted-foreground">执行特定工具操作并返回结果</p>
        </div>

              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800 mr-2">POST</Badge>
                  <code className="text-sm font-mono">/api/v1/batch</code>
                </div>
                <p className="text-sm text-muted-foreground">批量执行多个工具操作</p>
        </div>
        
              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 mr-2">GET</Badge>
                  <code className="text-sm font-mono">/api/v1/status</code>
                </div>
                <p className="text-sm text-muted-foreground">检查服务器状态和健康情况</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="server-dev" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>开发指南</CardTitle>
                <CardDescription>创建自定义MCP服务器</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  从零开始构建MCP服务器的详细指南，包括架构设计、工具定义和安全最佳实践。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/dev/guide">
                    查看指南
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>模板项目</CardTitle>
                <CardDescription>快速启动开发</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  多语言MCP服务器模板，帮助开发者快速开始构建自己的MCP服务。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/dev/templates">
                    查看模板
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>高级功能</CardTitle>
                <CardDescription>扩展MCP服务器能力</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  高级服务器功能的实现，包括认证、流式响应、实时更新等。
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/dev/advanced">
                    查看文档
              </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 max-w-3xl border border-blue-200 dark:border-blue-900">
            <div className="flex items-start mb-4">
              <Code className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <h3 className="text-lg font-medium">MCP服务器代码示例</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">使用Node.js创建简单的MCP服务器：</p>
              <div className="bg-gray-950 text-gray-200 p-3 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{`import express from 'express';
import { MCPServer, ToolDefinition } from 'mcp-server';

const app = express();
const port = 3000;

// 定义MCP工具
const weatherTool: ToolDefinition = {
  name: 'weather_tool',
  description: '获取指定城市的天气信息',
  parameters: {
    city: { type: 'string', description: '城市名称' },
    days: { type: 'number', description: '天数', default: 1 }
  },
  handler: async (params) => {
    // 实际实现中，这里应该调用天气API
    return {
      forecast: [
        { date: '2023-06-01', temp: 28, condition: '晴天' }
      ]
    };
  }
};

// 创建MCP服务器实例
const mcpServer = new MCPServer();
mcpServer.registerTool(weatherTool);

// 使用Express作为HTTP服务器
app.use(express.json());
app.use('/api/v1', mcpServer.createRouter());

app.listen(port, () => {
  console.log(\`MCP服务器正在监听 \${port} 端口\`);
});`}</pre>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="use-cases" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <CardTitle>数据查询与分析</CardTitle>
                <CardDescription>连接AI与结构化数据</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  实现MCP服务器与数据库的连接，使AI能够执行SQL查询、数据分析和可视化，实现智能数据分析助手。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">数据库</Badge>
                  <Badge variant="secondary">SQL</Badge>
                  <Badge variant="secondary">分析</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/use-cases/data-query">
                    查看案例
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <CardTitle>文档处理</CardTitle>
                <CardDescription>智能文档管理与分析</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  通过MCP服务器使AI能够读取、解析和处理各种文档格式，自动提取信息并生成报告。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">PDF</Badge>
                  <Badge variant="secondary">OCR</Badge>
                  <Badge variant="secondary">文档分析</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/use-cases/document-processing">
                    查看案例
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <CardTitle>API集成</CardTitle>
                <CardDescription>连接第三方服务</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  使用MCP服务器作为中间层，安全地连接AI与第三方API，实现复杂业务流程自动化。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">API代理</Badge>
                  <Badge variant="secondary">集成</Badge>
                  <Badge variant="secondary">自动化</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/use-cases/api-integration">
                    查看案例
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-950 border shadow-md">
              <CardHeader>
                <CardTitle>本地工具执行</CardTitle>
                <CardDescription>扩展AI的本地能力</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  通过MCP服务器赋予AI执行本地命令和脚本的能力，实现开发辅助、系统管理等高级功能。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">命令执行</Badge>
                  <Badge variant="secondary">脚本</Badge>
                  <Badge variant="secondary">开发工具</Badge>
        </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/docs/use-cases/local-tools">
                    查看案例
                  </Link>
                </Button>
              </CardFooter>
            </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 