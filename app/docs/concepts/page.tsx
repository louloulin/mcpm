"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { 
  ArrowLeft, 
  Brain, 
  Code, 
  Server, 
  Network,
  Puzzle,
  Cpu,
  Globe,
  BookOpen,
  Lightbulb,
  Zap,
  Layers
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 自定义 Callout 组件
interface CalloutProps {
  className?: string;
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
}

const Callout = ({ children, className, type = "info" }: CalloutProps) => {
  const baseClass = "p-4 rounded-md border";
  const typeClass = {
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    success: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
  };

  return (
    <div className={`${baseClass} ${typeClass[type]} ${className || ''}`}>
      {children}
    </div>
  );
};

// 示例代码
const clientCodeExample = `import { MCPClient } from 'mcp-client';

// 初始化MCP客户端
const client = new MCPClient({
  serverUrl: 'http://localhost:8080'
});

// 调用MCP工具
async function getWeather(city) {
  const response = await client.invoke('weather_tool', {
    city: city
  });
  
  return response.data;
}

// 使用示例
const weather = await getWeather('北京');
console.log(\`当前天气: \${weather.condition}, 温度: \${weather.temperature}°C\`);
`;

const toolDefinitionExample = `{
  "name": "weather_tool",
  "description": "获取城市天气信息",
  "parameters": {
    "city": {
      "type": "string",
      "description": "要查询天气的城市名称",
      "required": true
    }
  }
}`;

const serverCodeExample = `// 实现天气工具处理函数
export async function weatherTool(params) {
  const { city } = params;
  
  // 调用第三方天气API
  const weatherData = await fetchWeatherData(city);
  
  // 返回处理后的结果
  return {
    condition: weatherData.condition,
    temperature: weatherData.temp,
    humidity: weatherData.humidity,
    wind: weatherData.wind
  };
}`;

export default function ConceptsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回文档中心
        </Link>
        <h1 className="text-4xl font-bold">MCP基础概念</h1>
        <p className="text-xl text-muted-foreground mt-2">了解Model Context Protocol的核心概念和工作原理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">目录</p>
              <div className="space-y-1 text-sm">
                <a href="#what-is-mcp" className="block py-1 text-muted-foreground hover:text-primary">什么是MCP</a>
                <a href="#core-concepts" className="block py-1 text-muted-foreground hover:text-primary">核心概念</a>
                <a href="#architecture" className="block py-1 text-muted-foreground hover:text-primary">架构原理</a>
                <a href="#components" className="block py-1 text-muted-foreground hover:text-primary">主要组件</a>
                <a href="#use-cases" className="block py-1 text-muted-foreground hover:text-primary">使用场景</a>
                <a href="#best-practices" className="block py-1 text-muted-foreground hover:text-primary">最佳实践</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-10">
          <section id="what-is-mcp" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">什么是MCP</h2>
            <p className="text-muted-foreground mb-4">
              MCP（Model Context Protocol）是一种设计用于扩展大型语言模型（LLM）能力的协议。它解决了LLM无法直接与外部世界交互的局限性，让模型能够安全地调用外部工具和服务，从而执行更广泛的任务。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">增强AI能力</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    让AI模型能够访问实时数据、调用APIs、执行计算等操作
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Puzzle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">标准化接口</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    提供统一的工具调用协议，简化AI与外部系统的集成
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">可扩展性</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    允许开发者自定义工具和服务，灵活扩展AI的功能范围
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Callout className="mb-6">
              <p>
                <strong>核心优势</strong>：MCP服务器使AI能够突破知识截止日期的限制，获取最新信息，并执行模型本身无法完成的操作。这大大扩展了AI应用的可能性。
              </p>
            </Callout>
          </section>

          <Separator />

          <section id="core-concepts" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">核心概念</h2>
            <p className="text-muted-foreground mb-6">
              理解MCP的基础需要掌握以下几个核心概念：
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary" />
                  工具（Tools）
                </h3>
                <p className="text-muted-foreground mb-4">
                  工具是MCP协议中最基本的功能单元，代表AI可以调用的特定功能。每个工具都有：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><span className="font-medium">名称</span>：唯一标识符</li>
                  <li><span className="font-medium">描述</span>：工具的功能说明</li>
                  <li><span className="font-medium">参数定义</span>：工具需要的输入</li>
                  <li><span className="font-medium">输出定义</span>：工具返回的结果格式</li>
                </ul>
                <div className="bg-gray-950 rounded-md p-4 mb-4">
                  <p className="text-sm text-gray-400 mb-2">工具定义示例:</p>
                  <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {toolDefinitionExample}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Server className="h-5 w-5 mr-2 text-primary" />
                  服务器（Servers）
                </h3>
                <p className="text-muted-foreground mb-4">
                  MCP服务器是托管和执行工具的环境。服务器负责：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>接收和验证工具调用请求</li>
                  <li>执行相应的工具功能</li>
                  <li>返回结果给调用方</li>
                  <li>管理安全和资源控制</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-primary" />
                  客户端（Clients）
                </h3>
                <p className="text-muted-foreground mb-4">
                  MCP客户端是AI模型或应用程序用来与MCP服务器通信的接口。客户端负责：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>格式化工具调用请求</li>
                  <li>发送请求到MCP服务器</li>
                  <li>接收和解析结果</li>
                  <li>处理错误和重试逻辑</li>
                </ul>
                <div className="bg-gray-950 rounded-md p-4">
                  <p className="text-sm text-gray-400 mb-2">客户端调用示例:</p>
                  <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {clientCodeExample}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          <section id="architecture" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">架构原理</h2>
            <p className="text-muted-foreground mb-6">
              MCP的架构设计围绕着实现AI与外部世界安全高效的交互。下面是MCP的基本工作流程：
            </p>

            <div className="border rounded-lg p-6 mb-6 bg-muted/20">
              <ol className="list-decimal space-y-6 pl-6">
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">识别需求</span>
                  <p className="mt-1">AI模型识别出需要外部工具支持的任务（如获取实时数据或执行特定操作）</p>
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">发送请求</span>
                  <p className="mt-1">AI模型通过MCP客户端构造请求，指定工具名称和参数</p>
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">服务器处理</span>
                  <p className="mt-1">MCP服务器接收请求，验证参数，并调用相应的工具实现</p>
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">执行操作</span>
                  <p className="mt-1">工具执行所需操作，如查询数据库、调用API或进行计算</p>
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">返回结果</span>
                  <p className="mt-1">服务器将工具执行结果返回给客户端</p>
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">整合信息</span>
                  <p className="mt-1">AI模型将获取的信息整合到响应中，提供给用户</p>
                </li>
              </ol>
            </div>

            <Callout type="info" className="mb-6">
              <p>
                <strong>安全考虑</strong>：MCP架构设计包含多层安全机制，包括请求验证、权限控制、资源限制和日志审计，确保AI只能在授权范围内执行操作。
              </p>
            </Callout>
          </section>

          <Separator />

          <section id="components" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">主要组件</h2>
            <p className="text-muted-foreground mb-6">
              MCP生态系统由多个关键组件组成，各自负责不同的功能：
            </p>

            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="server-components">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Server className="h-5 w-5 mr-2 text-primary" />
                    服务器组件
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-9">
                    <div>
                      <h4 className="font-medium">工具注册表</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        管理服务器提供的所有工具定义、描述和元数据。允许动态注册和发现工具。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">请求处理器</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        接收、验证和路由工具调用请求，确保参数符合工具定义规范。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">工具执行环境</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        提供安全的沙箱环境运行工具代码，避免潜在风险。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">安全管理器</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        处理认证、授权和访问控制，确保只有授权客户端可以调用特定工具。
                      </p>
                    </div>
                    
                    <div className="bg-gray-950 rounded-md p-4">
                      <p className="text-sm text-gray-400 mb-2">服务器端工具实现示例:</p>
                      <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                        {serverCodeExample}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="client-components">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Code className="h-5 w-5 mr-2 text-primary" />
                    客户端组件
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-9">
                    <div>
                      <h4 className="font-medium">工具发现</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        查询和获取服务器提供的工具列表及其描述，帮助AI模型了解可用功能。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">请求构造器</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        根据工具定义构建符合规范的调用请求，包括参数验证。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">通信模块</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        处理与服务器的HTTP/WebSocket通信，包括错误处理和重试逻辑。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">结果解析器</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        解析和转换服务器返回的工具执行结果，以便AI模型使用。
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="integration-components">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Network className="h-5 w-5 mr-2 text-primary" />
                    集成组件
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-9">
                    <div>
                      <h4 className="font-medium">LLM适配器</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        为特定大语言模型提供的适配层，使模型能无缝集成MCP功能。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">中间件</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        在请求处理流程中插入自定义逻辑，如日志记录、缓存或请求转换。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">代理组件</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        智能路由工具调用到最合适的服务器，支持负载均衡和故障转移。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">监控系统</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        收集和分析MCP服务器和客户端的性能指标、使用情况和错误报告。
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          <section id="use-cases" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">使用场景</h2>
            <p className="text-muted-foreground mb-6">
              MCP服务器在多种场景中有广泛应用，以下是几个典型案例：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">实时数据访问</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    让AI访问最新的天气数据、股票价格、新闻事件等实时信息。
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>个人助手获取实时天气预报</li>
                    <li>财务顾问提供最新市场数据分析</li>
                    <li>新闻摘要工具获取近期事件</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">复杂计算与分析</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    执行AI模型无法直接完成的专业计算和数据分析任务。
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>科学计算与模拟</li>
                    <li>大规模数据分析</li>
                    <li>复杂图形和图像处理</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">系统集成</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    连接AI与各种企业系统和服务，实现工作流自动化。
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>CRM系统操作</li>
                    <li>项目管理工具集成</li>
                    <li>企业资源规划系统连接</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">知识库访问</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    提供对专业或私有知识库的查询和检索能力。
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>企业内部文档搜索</li>
                    <li>专业领域知识检索</li>
                    <li>个人知识库管理</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Callout type="success" className="mb-6">
              <p>
                <strong>实际案例</strong>：某金融科技公司使用MCP服务器为其AI助手提供实时市场数据分析能力，让用户能够获取最新投资建议。MCP服务器处理复杂的金融计算并遵守安全规范，同时AI负责将专业数据转化为用户易懂的建议。
              </p>
            </Callout>
          </section>

          <Separator />

          <section id="best-practices" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">最佳实践</h2>
            <p className="text-muted-foreground mb-6">
              为了充分发挥MCP的潜力，建议遵循以下最佳实践：
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  工具设计原则
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><span className="font-medium">单一职责</span>：每个工具应专注于一个明确的功能</li>
                  <li><span className="font-medium">清晰文档</span>：详细描述工具功能、参数和返回值</li>
                  <li><span className="font-medium">严格验证</span>：对所有输入参数进行验证</li>
                  <li><span className="font-medium">优雅错误处理</span>：返回有意义的错误信息</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Server className="h-5 w-5 mr-2 text-primary" />
                  服务器配置建议
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><span className="font-medium">性能优化</span>：针对高频工具进行缓存</li>
                  <li><span className="font-medium">超时控制</span>：为每个工具设置合理的执行时间限制</li>
                  <li><span className="font-medium">并发限制</span>：设置适当的并发请求数上限</li>
                  <li><span className="font-medium">完善监控</span>：实时监控服务状态和性能指标</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 flex items-center">
                  <Code className="h-5 w-5 mr-2 text-primary" />
                  安全最佳实践
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><span className="font-medium">权限分级</span>：实施最小权限原则</li>
                  <li><span className="font-medium">请求身份验证</span>：验证所有工具调用的来源</li>
                  <li><span className="font-medium">敏感数据保护</span>：加密传输中和存储中的敏感信息</li>
                  <li><span className="font-medium">完整审计日志</span>：记录所有工具调用详情</li>
                </ul>
              </div>
            </div>

            <Callout type="warning" className="mb-6">
              <p>
                <strong>重要提示</strong>：MCP服务器可能会处理敏感信息或执行关键操作，因此安全性至关重要。确保始终遵循安全最佳实践，定期更新依赖，并实施适当的访问控制措施。
              </p>
            </Callout>
          </section>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900 mt-10">
            <h3 className="text-lg font-medium mb-4">继续学习</h3>
            <p className="text-muted-foreground mb-4">
              现在您已经了解了MCP的基础概念，可以通过以下资源继续深入学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/installation" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <Server className="h-4 w-4" />
                <span>MCP服务器安装指南</span>
              </Link>
              <Link href="/docs/quickstart" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <Zap className="h-4 w-4" />
                <span>快速入门教程</span>
              </Link>
              <Link href="/docs/api-reference" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <Code className="h-4 w-4" />
                <span>API参考文档</span>
              </Link>
              <Link href="/docs/tutorials" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <BookOpen className="h-4 w-4" />
                <span>高级教程</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 