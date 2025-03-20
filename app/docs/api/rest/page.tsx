"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  Terminal, 
  Server, 
  CheckCircle2,
  Copy,
  Globe,
  Key,
  Code,
  Database
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

// API示例
const authHeaderExample = `Authorization: Bearer YOUR_API_TOKEN`;

const getServersExample = `GET /api/v1/servers
Accept: application/json`;

const getServersResponse = `{
  "servers": [
    {
      "id": "server-1",
      "name": "Production Server",
      "status": "running",
      "created_at": "2023-01-15T08:30:00Z",
      "updated_at": "2023-03-20T14:22:15Z"
    },
    {
      "id": "server-2",
      "name": "Development Server",
      "status": "stopped",
      "created_at": "2023-02-05T10:15:00Z",
      "updated_at": "2023-03-18T09:45:30Z"
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 10
}`;

const getServerExample = `GET /api/v1/servers/:id
Accept: application/json`;

const getServerResponse = `{
  "id": "server-1",
  "name": "Production Server",
  "description": "Main production environment",
  "status": "running",
  "configuration": {
    "cpu": 4,
    "memory": "8GB",
    "storage": "100GB"
  },
  "endpoints": ["api", "admin", "metrics"],
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-03-20T14:22:15Z"
}`;

const createServerExample = `POST /api/v1/servers
Content-Type: application/json
Accept: application/json

{
  "name": "New Test Server",
  "description": "Server for integration tests",
  "configuration": {
    "cpu": 2,
    "memory": "4GB",
    "storage": "50GB"
  }
}`;

const createServerResponse = `{
  "id": "server-3",
  "name": "New Test Server",
  "description": "Server for integration tests",
  "status": "provisioning",
  "configuration": {
    "cpu": 2,
    "memory": "4GB",
    "storage": "50GB"
  },
  "endpoints": [],
  "created_at": "2023-03-21T10:30:00Z",
  "updated_at": "2023-03-21T10:30:00Z"
}`;

const updateServerExample = `PATCH /api/v1/servers/:id
Content-Type: application/json
Accept: application/json

{
  "name": "Updated Server Name",
  "description": "Updated description"
}`;

const updateServerResponse = `{
  "id": "server-1",
  "name": "Updated Server Name",
  "description": "Updated description",
  "status": "running",
  "configuration": {
    "cpu": 4,
    "memory": "8GB",
    "storage": "100GB"
  },
  "endpoints": ["api", "admin", "metrics"],
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-03-21T11:05:22Z"
}`;

const deleteServerExample = `DELETE /api/v1/servers/:id
Accept: application/json`;

const deleteServerResponse = `{
  "success": true,
  "message": "Server successfully deleted"
}`;

// 复制到剪贴板函数
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={copyToClipboard}
      className="absolute right-2 top-2"
    >
      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function RestApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">REST API 文档</h1>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Globe className="mr-2 h-6 w-6" />
          概述
        </h2>
        <p>
          MCPM REST API 允许开发者通过标准的 HTTP 请求与 MCPM 服务器交互。
          您可以通过 API 管理服务器、监控状态、配置设置等功能。
        </p>
        <Callout>
          <div className="flex items-start">
            <Terminal className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">API 基础 URL</p>
              <code className="text-sm bg-secondary p-1 rounded">https://api.mcpm.com/v1</code>
            </div>
          </div>
        </Callout>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Key className="mr-2 h-6 w-6" />
          认证
        </h2>
        <p>
          所有 API 请求需要使用 API 令牌进行认证。令牌应该在 HTTP 请求的 <code>Authorization</code> 头中提供。
        </p>
        <div className="relative">
          <SyntaxHighlighter 
            language="http" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {authHeaderExample}
          </SyntaxHighlighter>
          <CopyButton text={authHeaderExample} />
        </div>
        <p className="mt-4">
          您可以在 MCPM 账户设置页面生成 API 令牌。请确保妥善保管您的令牌，并且不要在客户端代码中暴露它。
        </p>

        <h2 className="flex items-center text-2xl font-semibold mt-10 mb-6">
          <Code className="mr-2 h-6 w-6" />
          API 端点
        </h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="servers">
            <AccordionTrigger className="text-xl font-medium">服务器管理</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-8">
                {/* 获取服务器列表 */}
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Server className="mr-2 h-5 w-5" />
                    获取服务器列表
                  </h3>
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
                    <code className="text-sm bg-secondary p-1 rounded">/servers</code>
                  </div>
                  <p className="mb-2">
                    返回当前用户有权访问的所有服务器列表。支持分页、排序和过滤。
                  </p>
                  
                  <Tabs defaultValue="request">
                    <TabsList>
                      <TabsTrigger value="request">请求示例</TabsTrigger>
                      <TabsTrigger value="response">响应示例</TabsTrigger>
                      <TabsTrigger value="params">请求参数</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="http" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {getServersExample}
                        </SyntaxHighlighter>
                        <CopyButton text={getServersExample} />
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {getServersResponse}
                        </SyntaxHighlighter>
                        <CopyButton text={getServersResponse} />
                      </div>
                    </TabsContent>
                    <TabsContent value="params">
                      <div className="bg-card border rounded-md p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left pb-2">参数</th>
                              <th className="text-left pb-2">类型</th>
                              <th className="text-left pb-2">描述</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 pr-4"><code>page</code></td>
                              <td className="py-2 pr-4">Integer</td>
                              <td className="py-2">页码，默认为 1</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4"><code>per_page</code></td>
                              <td className="py-2 pr-4">Integer</td>
                              <td className="py-2">每页项目数，默认为 10，最大为 100</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4"><code>status</code></td>
                              <td className="py-2 pr-4">String</td>
                              <td className="py-2">按状态过滤 (running, stopped, error)</td>
                            </tr>
                            <tr>
                              <td className="py-2 pr-4"><code>sort</code></td>
                              <td className="py-2 pr-4">String</td>
                              <td className="py-2">排序字段 (created_at, name)，默认为 created_at</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 获取特定服务器 */}
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Server className="mr-2 h-5 w-5" />
                    获取特定服务器
                  </h3>
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
                    <code className="text-sm bg-secondary p-1 rounded">/servers/:id</code>
                  </div>
                  <p className="mb-2">
                    返回指定 ID 的服务器详细信息。
                  </p>
                  
                  <Tabs defaultValue="request">
                    <TabsList>
                      <TabsTrigger value="request">请求示例</TabsTrigger>
                      <TabsTrigger value="response">响应示例</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="http" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {getServerExample}
                        </SyntaxHighlighter>
                        <CopyButton text={getServerExample} />
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {getServerResponse}
                        </SyntaxHighlighter>
                        <CopyButton text={getServerResponse} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 创建服务器 */}
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Server className="mr-2 h-5 w-5" />
                    创建服务器
                  </h3>
                  <div className="flex items-center mb-2">
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs mr-2">POST</span>
                    <code className="text-sm bg-secondary p-1 rounded">/servers</code>
                  </div>
                  <p className="mb-2">
                    创建一个新的服务器实例。
                  </p>
                  
                  <Tabs defaultValue="request">
                    <TabsList>
                      <TabsTrigger value="request">请求示例</TabsTrigger>
                      <TabsTrigger value="response">响应示例</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="http" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {createServerExample}
                        </SyntaxHighlighter>
                        <CopyButton text={createServerExample} />
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {createServerResponse}
                        </SyntaxHighlighter>
                        <CopyButton text={createServerResponse} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 更新服务器 */}
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Server className="mr-2 h-5 w-5" />
                    更新服务器
                  </h3>
                  <div className="flex items-center mb-2">
                    <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs mr-2">PATCH</span>
                    <code className="text-sm bg-secondary p-1 rounded">/servers/:id</code>
                  </div>
                  <p className="mb-2">
                    更新指定 ID 的服务器信息。
                  </p>
                  
                  <Tabs defaultValue="request">
                    <TabsList>
                      <TabsTrigger value="request">请求示例</TabsTrigger>
                      <TabsTrigger value="response">响应示例</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="http" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {updateServerExample}
                        </SyntaxHighlighter>
                        <CopyButton text={updateServerExample} />
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {updateServerResponse}
                        </SyntaxHighlighter>
                        <CopyButton text={updateServerResponse} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 删除服务器 */}
                <div>
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Server className="mr-2 h-5 w-5" />
                    删除服务器
                  </h3>
                  <div className="flex items-center mb-2">
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs mr-2">DELETE</span>
                    <code className="text-sm bg-secondary p-1 rounded">/servers/:id</code>
                  </div>
                  <p className="mb-2">
                    删除指定 ID 的服务器。
                  </p>
                  
                  <Tabs defaultValue="request">
                    <TabsList>
                      <TabsTrigger value="request">请求示例</TabsTrigger>
                      <TabsTrigger value="response">响应示例</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="http" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {deleteServerExample}
                        </SyntaxHighlighter>
                        <CopyButton text={deleteServerExample} />
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <div className="relative">
                        <SyntaxHighlighter 
                          language="json" 
                          style={vscDarkPlus}
                          customStyle={{borderRadius: '0.5rem'}}
                        >
                          {deleteServerResponse}
                        </SyntaxHighlighter>
                        <CopyButton text={deleteServerResponse} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="users">
            <AccordionTrigger className="text-xl font-medium">用户管理</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p>
                  用户管理 API 允许您查询、创建和管理用户账户。
                  <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs ml-2">
                    需要管理员权限
                  </span>
                </p>
                <Callout className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex">
                    <Terminal className="h-5 w-5 mr-2 text-blue-500" />
                    <p>
                      查看<Link href="/docs/api/rest/users" className="text-primary font-medium hover:underline">用户管理 API 详细文档</Link>了解更多信息。
                    </p>
                  </div>
                </Callout>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stats">
            <AccordionTrigger className="text-xl font-medium">数据统计</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p>
                  数据统计 API 提供平台使用情况的指标和分析数据。
                </p>
                <Callout className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex">
                    <Terminal className="h-5 w-5 mr-2 text-blue-500" />
                    <p>
                      查看<Link href="/docs/api/rest/stats" className="text-primary font-medium hover:underline">数据统计 API 详细文档</Link>了解更多信息。
                    </p>
                  </div>
                </Callout>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="auth">
            <AccordionTrigger className="text-xl font-medium">认证与授权</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p>
                  认证 API 用于管理令牌、权限和用户会话。
                </p>
                <Callout className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex">
                    <Terminal className="h-5 w-5 mr-2 text-blue-500" />
                    <p>
                      查看<Link href="/docs/api/rest/auth" className="text-primary font-medium hover:underline">认证 API 详细文档</Link>了解更多信息。
                    </p>
                  </div>
                </Callout>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="flex items-center text-2xl font-semibold mt-10 mb-4">
          <Database className="mr-2 h-6 w-6" />
          错误处理
        </h2>
        <p>
          API 使用标准 HTTP 状态码表示请求结果。通常：
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><code>200 OK</code> - 请求成功</li>
          <li><code>201 Created</code> - 资源创建成功</li>
          <li><code>400 Bad Request</code> - 请求参数错误</li>
          <li><code>401 Unauthorized</code> - 未提供或无效的认证凭据</li>
          <li><code>403 Forbidden</code> - 没有权限访问资源</li>
          <li><code>404 Not Found</code> - 资源不存在</li>
          <li><code>429 Too Many Requests</code> - 请求频率超过限制</li>
          <li><code>500 Internal Server Error</code> - 服务器错误</li>
        </ul>

        <div className="bg-card border rounded-md p-4 mt-4">
          <p className="font-medium mb-2">错误响应格式示例:</p>
          <div className="relative">
            <SyntaxHighlighter 
              language="json" 
              style={vscDarkPlus}
              customStyle={{borderRadius: '0.5rem'}}
            >
              {`{
  "error": {
    "code": "resource_not_found",
    "message": "The requested server with ID 'unknown-id' was not found",
    "details": {
      "resource_type": "server",
      "resource_id": "unknown-id"
    }
  }
}`}
            </SyntaxHighlighter>
          </div>
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-10 mb-4">
          <Terminal className="mr-2 h-6 w-6" />
          速率限制
        </h2>
        <p>
          为了保持服务的稳定性，API 请求会受到速率限制。当达到限制时，服务器将返回 <code>429 Too Many Requests</code> 状态码。
        </p>
        <p className="mt-2">
          响应头中包含的速率限制信息:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><code>X-RateLimit-Limit</code>: 在当前时间窗口内允许的最大请求数</li>
          <li><code>X-RateLimit-Remaining</code>: 在当前时间窗口内剩余的请求数</li>
          <li><code>X-RateLimit-Reset</code>: 当前时间窗口重置的时间戳（Unix 时间）</li>
        </ul>

        <div className="mt-10 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-medium mb-2">需要帮助？</h3>
          <p>
            如果您有任何问题或需要进一步的帮助，请查看我们的<Link href="/docs/faq" className="text-primary hover:underline">常见问题</Link>或
            <Link href="https://github.com/mcpm/mcpm/issues" className="text-primary hover:underline ml-1">提交 GitHub Issue</Link>。
          </p>
        </div>
      </div>
    </div>
  );
} 