"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server, Globe, Code, Webhook } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">API 文档</h1>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <p className="text-lg">
          MCPM 提供多种 API 接口，方便开发者与平台集成并扩展其功能。
          选择以下任意一种 API 类型开始使用：
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* REST API */}
          <div className="border rounded-lg overflow-hidden bg-card transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Globe className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-semibold">REST API</h2>
              </div>
              <p className="mb-4 text-muted-foreground">
                使用标准的 HTTP 请求与 MCPM 服务交互，适用于大多数集成场景。
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>简单直观的 HTTP 接口</li>
                <li>支持所有主要编程语言</li>
                <li>完整的资源管理能力</li>
                <li>基于 Token 的认证</li>
              </ul>
              <Link href="/docs/api/rest">
                <Button>
                  查看文档
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>

          {/* GraphQL API */}
          <div className="border rounded-lg overflow-hidden bg-card transition-all hover:shadow-md opacity-60">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Code className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-semibold">GraphQL API</h2>
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  即将推出
                </span>
              </div>
              <p className="mb-4 text-muted-foreground">
                灵活查询所需数据，减少请求次数和数据传输量。
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>精确获取所需数据</li>
                <li>减少网络请求</li>
                <li>强类型模式</li>
                <li>实时数据订阅</li>
              </ul>
              <Link href="/docs/api/graphql">
                <Button variant="outline">
                  查看预览
                </Button>
              </Link>
            </div>
          </div>

          {/* Webhooks */}
          <div className="border rounded-lg overflow-hidden bg-card transition-all hover:shadow-md opacity-60">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Webhook className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-semibold">Webhooks</h2>
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  即将推出
                </span>
              </div>
              <p className="mb-4 text-muted-foreground">
                接收实时事件通知，实现自动化工作流。
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>实时事件通知</li>
                <li>自定义回调 URL</li>
                <li>可配置事件类型</li>
                <li>重试机制</li>
              </ul>
              <Link href="/docs/api/webhooks">
                <Button variant="outline">
                  查看预览
                </Button>
              </Link>
            </div>
          </div>

          {/* CLI API */}
          <div className="border rounded-lg overflow-hidden bg-card transition-all hover:shadow-md opacity-60">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Server className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-semibold">CLI API</h2>
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  即将推出
                </span>
              </div>
              <p className="mb-4 text-muted-foreground">
                通过命令行工具访问和控制 MCPM 资源。
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>自动化脚本支持</li>
                <li>批量操作能力</li>
                <li>集成开发流程</li>
                <li>无缝 CI/CD 集成</li>
              </ul>
              <Button disabled variant="outline">
                即将推出
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 border rounded-lg bg-muted">
          <h3 className="text-xl font-semibold mb-2">API 密钥管理</h3>
          <p className="mb-4">
            所有 API 访问都需要有效的 API 密钥。您可以在账户设置中创建和管理 API 密钥。
          </p>
          <Link href="/dashboard/settings/api-keys">
            <Button variant="outline">
              管理 API 密钥
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 