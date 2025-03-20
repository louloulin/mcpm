"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Server, Code, Shield, Rocket, Clock, FileJson, Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="container mx-auto py-12 space-y-16">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-8 pb-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight">
            MCP服务器
            <span className="text-blue-600 dark:text-blue-500">管理平台</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            构建、管理和部署 Model Context Protocol 服务器，
            扩展大语言模型的能力范围，实现更智能的AI交互体验
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/servers">
              浏览MCP服务器
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs">
              查看文档
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">MCP服务器的核心优势</h2>
          <p className="text-muted-foreground">让AI模型能够访问实时数据、调用外部服务和执行复杂操作</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-600" />
                <CardTitle>简易开发</CardTitle>
              </div>
              <CardDescription>快速构建和部署MCP服务器</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                提供多种语言的SDK和开发模板，简化MCP服务器的开发流程，无需深入了解底层协议细节。
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>安全可控</CardTitle>
              </div>
              <CardDescription>完善的安全防护机制</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                内置权限控制、请求验证和沙箱执行环境，确保AI模型只能在授权范围内访问资源和执行操作。
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <CardTitle>扩展能力</CardTitle>
              </div>
              <CardDescription>显著增强AI模型的能力范围</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                让AI模型能够访问实时数据、进行复杂计算、与外部系统交互，解锁更多应用场景。
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle>实时响应</CardTitle>
              </div>
              <CardDescription>高效的请求处理</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                优化的请求处理流程和缓存机制，确保AI模型能够快速获取所需信息，提供流畅的用户体验。
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileJson className="h-5 w-5 text-blue-600" />
                <CardTitle>标准协议</CardTitle>
              </div>
              <CardDescription>遵循MCP规范</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                完全兼容Model Context Protocol标准，确保与各种AI模型和平台的无缝集成和互操作性。
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <CardTitle>可视化管理</CardTitle>
              </div>
              <CardDescription>直观的管理界面</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                通过本平台轻松管理多个MCP服务器，监控性能指标，查看使用统计，简化运维工作。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Get Started Section */}
      <div className="bg-blue-50 dark:bg-blue-950/30 p-8 rounded-xl border border-blue-200 dark:border-blue-800 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">开始构建你的MCP服务器</h2>
            <p className="text-muted-foreground">
              立即开始使用我们的平台构建、部署和管理MCP服务器，扩展AI能力，创造更智能的应用。
            </p>
            <div className="pt-4">
              <Button asChild>
                <Link href="/upload">
                  <span className="flex items-center">
                    <Server className="mr-2 h-4 w-4" />
                    上传MCP服务器
                  </span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium">MCP服务器快速创建示例</div>
              <div className="h-2 w-16 bg-blue-200 dark:bg-blue-800 rounded"></div>
            </div>
            <pre className="bg-gray-950 text-gray-200 p-4 rounded-md overflow-x-auto text-sm font-mono">
{`# 安装MCP服务器创建工具
npm install -g create-mcp-server

# 创建新的MCP服务器项目
create-mcp-server my-weather-server

# 进入项目目录
cd my-weather-server

# 启动开发服务器
npm run dev`}
            </pre>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold">加入MCP开发者社区</h2>
        <p className="text-muted-foreground">
          探索最佳实践、分享经验、获取支持，与其他开发者共同推动AI能力的边界
        </p>
        <div className="pt-2">
          <Button variant="outline" size="lg" asChild>
            <Link href="/docs/community">
              <span className="flex items-center">
                加入社区 <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
