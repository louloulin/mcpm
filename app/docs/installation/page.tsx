"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { 
  ArrowLeft, 
  Terminal, 
  CornerDownRight, 
  Server, 
  CheckCircle2,
  Copy,
  Cpu,
  Github as LucideGithub
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 自定义 Callout 组件
interface CalloutProps {
  className?: string;
  children: React.ReactNode;
}

const Callout = ({ children, className }: CalloutProps) => (
  <div className={`bg-muted p-4 rounded-md border ${className || ''}`}>
    {children}
  </div>
);

// 代码段
const installCodeNpm = `npm install -g mcpm`;
const installCodeYarn = `yarn global add mcpm`;
const installCodePnpm = `pnpm add -g mcpm`;

const initProjectCode = `mcpm init my-awesome-server
cd my-awesome-server`;

const installDepsCode = `npm install
# 或
yarn
# 或
pnpm install`;

const startServerCode = `npm run dev
# 或
yarn dev
# 或
pnpm run dev`;

const configCode = `// config.json
{
  "server": {
    "name": "my-awesome-server",
    "port": 8080,
    "host": "localhost"
  },
  "tools": [
    {
      "name": "hello_world",
      "description": "返回一个问候消息",
      "parameters": {
        "name": {
          "type": "string",
          "description": "要问候的名称",
          "required": true
        }
      }
    }
  ]
}`;

const dockerComposeContent = `version: '3'
services:
  mcpm:
    image: mcpm/mcpm:latest
    ports:
      - 8080:8080
    volumes:
      - ./config:/app/config
      - ./tools:/app/tools
    environment:
      - NODE_ENV=production
      - PORT=8080`;

export default function InstallationPage() {
  const [activeInstallTab, setActiveInstallTab] = useState("npm");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/docs" className="flex items-center text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回文档中心
        </Link>
        <h1 className="text-4xl font-bold">MCP服务器安装指南</h1>
        <p className="text-xl text-muted-foreground mt-2">从零开始设置并运行你的MCP服务器</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">目录</p>
              <div className="space-y-1 text-sm">
                <a href="#prerequisites" className="block py-1 text-muted-foreground hover:text-primary">系统要求</a>
                <a href="#installation" className="block py-1 text-muted-foreground hover:text-primary">安装</a>
                <a href="#quickstart" className="block py-1 text-muted-foreground hover:text-primary">快速开始</a>
                <a href="#configuration" className="block py-1 text-muted-foreground hover:text-primary">配置选项</a>
                <a href="#docker" className="block py-1 text-muted-foreground hover:text-primary">Docker部署</a>
                <a href="#troubleshooting" className="block py-1 text-muted-foreground hover:text-primary">常见问题</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-10">
          <section id="prerequisites" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">系统要求</h2>
            <p className="text-muted-foreground mb-4">
              在开始安装MCP服务器之前，请确保您的系统满足以下要求：
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Node.js环境</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Node.js 16.0.0 或更高版本
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">系统资源</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    最低2GB内存，推荐4GB或更高
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Callout className="mb-4">
              <p>
                <strong>提示</strong>：如果你还没有安装Node.js，请访问 
                <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Node.js官网
                </a> 
                下载并安装最新的LTS版本。
              </p>
            </Callout>
          </section>

          <Separator />

          <section id="installation" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">安装</h2>
            <p className="text-muted-foreground mb-6">
              MCP服务器可以通过npm、yarn或pnpm全局安装。选择你习惯的包管理器：
            </p>

            <Tabs value={activeInstallTab} onValueChange={setActiveInstallTab} className="mb-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                <TabsTrigger value="npm">npm</TabsTrigger>
                <TabsTrigger value="yarn">yarn</TabsTrigger>
                <TabsTrigger value="pnpm">pnpm</TabsTrigger>
              </TabsList>

              <TabsContent value="npm" className="relative">
                <div className="bg-gray-950 rounded-md p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(installCodeNpm, 'npm')}
                  >
                    {copied === 'npm' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {installCodeNpm}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>

              <TabsContent value="yarn" className="relative">
                <div className="bg-gray-950 rounded-md p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(installCodeYarn, 'yarn')}
                  >
                    {copied === 'yarn' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {installCodeYarn}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>

              <TabsContent value="pnpm" className="relative">
                <div className="bg-gray-950 rounded-md p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(installCodePnpm, 'pnpm')}
                  >
                    {copied === 'pnpm' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {installCodePnpm}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>
            </Tabs>

            <p className="text-muted-foreground mb-4">
              安装完成后，你可以通过运行以下命令来验证安装是否成功：
            </p>

            <div className="bg-gray-950 rounded-md p-4 relative mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                onClick={() => handleCopy('mcpm --version', 'version')}
              >
                {copied === 'version' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                mcpm --version
              </SyntaxHighlighter>
            </div>
          </section>

          <Separator />

          <section id="quickstart" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">快速开始</h2>
            <p className="text-muted-foreground mb-6">
              按照以下步骤快速创建并启动一个MCP服务器项目：
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2">1. 创建新项目</h3>
                <p className="text-muted-foreground mb-4">
                  使用MCP CLI创建一个新的服务器项目：
                </p>
                <div className="bg-gray-950 rounded-md p-4 relative mb-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(initProjectCode, 'init')}
                  >
                    {copied === 'init' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {initProjectCode}
                  </SyntaxHighlighter>
                </div>
                <p className="text-sm text-muted-foreground">
                  这将创建一个包含基本项目结构的新目录。
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">2. 安装依赖</h3>
                <p className="text-muted-foreground mb-4">
                  进入项目目录并安装依赖：
                </p>
                <div className="bg-gray-950 rounded-md p-4 relative mb-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(installDepsCode, 'deps')}
                  >
                    {copied === 'deps' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {installDepsCode}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">3. 启动服务器</h3>
                <p className="text-muted-foreground mb-4">
                  启动开发服务器：
                </p>
                <div className="bg-gray-950 rounded-md p-4 relative mb-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleCopy(startServerCode, 'start')}
                  >
                    {copied === 'start' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                    {startServerCode}
                  </SyntaxHighlighter>
                </div>
                <p className="text-sm text-muted-foreground">
                  服务器默认会在 <code className="bg-secondary px-1 py-0.5 rounded text-xs">http://localhost:8080</code> 上运行。你可以通过浏览器访问此地址查看API文档。
                </p>
              </div>

              <Callout className="mb-4">
                <p>
                  <strong>提示</strong>：生成的项目包含一些示例工具实现，你可以在 <code className="bg-secondary px-1 py-0.5 rounded text-xs">src/tools</code> 目录中找到它们。
                </p>
              </Callout>
            </div>
          </section>

          <Separator />

          <section id="configuration" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">配置选项</h2>
            <p className="text-muted-foreground mb-6">
              MCP服务器的配置文件位于项目根目录的 <code className="bg-secondary px-1 py-0.5 rounded text-xs">config.json</code> 文件中。以下是基本配置示例：
            </p>

            <div className="bg-gray-950 rounded-md p-4 relative mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                onClick={() => handleCopy(configCode, 'config')}
              >
                {copied === 'config' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                {configCode}
              </SyntaxHighlighter>
            </div>

            <h3 className="text-xl font-medium mb-4">主要配置项</h3>
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium">服务器设置</h4>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground mt-2">
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">name</code> - 服务器名称</li>
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">port</code> - 服务器监听端口</li>
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">host</code> - 绑定的主机地址</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">工具配置</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-2">
                  工具配置定义了服务器提供的功能。每个工具需要包含：
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">name</code> - 工具名称（唯一标识符）</li>
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">description</code> - 工具描述</li>
                  <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">parameters</code> - 参数定义</li>
                </ul>
              </div>
            </div>

            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="advanced-config">
                <AccordionTrigger>高级配置选项</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">安全设置</h4>
                      <ul className="ml-6 list-disc space-y-2 text-muted-foreground mt-2">
                        <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">security.apiKey</code> - 设置API密钥进行身份验证</li>
                        <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">security.cors</code> - 配置CORS策略</li>
                        <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">security.rateLimit</code> - 限制API请求频率</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">日志设置</h4>
                      <ul className="ml-6 list-disc space-y-2 text-muted-foreground mt-2">
                        <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">logger.level</code> - 日志级别（debug, info, warn, error）</li>
                        <li><code className="bg-secondary px-1 py-0.5 rounded text-xs">logger.file</code> - 日志文件路径</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          <section id="docker" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">Docker部署</h2>
            <p className="text-muted-foreground mb-6">
              MCP服务器也可以通过Docker容器部署，这是生产环境中推荐的方式。
            </p>

            <h3 className="text-xl font-medium mb-4">使用Docker Compose</h3>
            <p className="text-muted-foreground mb-4">
              创建一个<code className="bg-secondary px-1 py-0.5 rounded text-xs">docker-compose.yml</code>文件：
            </p>

            <div className="bg-gray-950 rounded-md p-4 relative mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                onClick={() => handleCopy(dockerComposeContent, 'docker')}
              >
                {copied === 'docker' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <SyntaxHighlighter language="yaml" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                {dockerComposeContent}
              </SyntaxHighlighter>
            </div>

            <p className="text-muted-foreground mb-4">
              然后，运行以下命令启动容器：
            </p>

            <div className="bg-gray-950 rounded-md p-4 relative mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
                onClick={() => handleCopy('docker-compose up -d', 'docker-run')}
              >
                {copied === 'docker-run' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                docker-compose up -d
              </SyntaxHighlighter>
            </div>
          </section>

          <Separator />

          <section id="troubleshooting" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">常见问题</h2>
            
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="port-in-use">
                <AccordionTrigger>端口已被占用</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-2">
                    如果你看到类似"端口8080已被占用"的错误，可以通过以下方法解决：
                  </p>
                  <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
                    <li>在配置文件中修改端口号为其他未使用的端口</li>
                    <li>结束使用该端口的其他进程</li>
                  </ol>
                  <div className="bg-gray-950 rounded-md p-4 mt-4">
                    <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                      # 查找占用端口的进程
                      lsof -i :8080
                      
                      # 终止进程
                      kill -9 [进程ID]
                    </SyntaxHighlighter>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="missing-deps">
                <AccordionTrigger>缺少依赖</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-2">
                    如果启动时报错缺少依赖，请确保你已正确安装所有依赖：
                  </p>
                  <div className="bg-gray-950 rounded-md p-4 mt-2">
                    <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ background: 'transparent', margin: 0 }}>
                      # 删除node_modules并重新安装
                      rm -rf node_modules
                      npm install
                    </SyntaxHighlighter>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tool-not-found">
                <AccordionTrigger>工具未找到</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-2">
                    如果调用工具时报"工具未找到"错误，请检查：
                  </p>
                  <ol className="ml-6 list-decimal space-y-2 text-muted-foreground">
                    <li>工具名称是否与配置文件中的完全一致（区分大小写）</li>
                    <li>确保工具实现文件存在于 <code className="bg-secondary px-1 py-0.5 rounded text-xs">src/tools</code> 目录中</li>
                    <li>检查工具导出是否正确</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-600" />
                需要更多帮助？
              </h3>
              <p className="text-muted-foreground mb-4">
                如果你遇到其他问题或需要更详细的帮助，可以通过以下渠道获取支持：
              </p>
              <div className="space-y-2">
                <Link href="https://github.com/mcp/mcpm/issues" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                  <LucideGithub className="h-4 w-4 mr-2" />
                  在GitHub上提交Issue
                </Link>
                <Link href="/docs/faq" className="flex items-center text-blue-600 hover:underline">
                  <CornerDownRight className="h-4 w-4 mr-2" />
                  查看完整FAQ
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 