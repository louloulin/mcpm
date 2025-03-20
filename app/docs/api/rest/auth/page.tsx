"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2,
  Copy,
  Key,
  Lock,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// API示例
const loginExample = `POST /api/v1/auth/login
Content-Type: application/json
Accept: application/json

{
  "username": "admin",
  "password": "securepassword123"
}`;

const loginResponse = `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjc5MzgyNjAwLCJleHAiOjE2Nzk0NjkwMDB9.8JYCUy6uuQkJJl0jRLhDQx_IH5mtaoPP5t0sXtWGFHE",
  "user": {
    "id": "user-1",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "expires_at": "2023-03-22T10:30:00Z"
}`;

const createTokenExample = `POST /api/v1/auth/tokens
Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_SESSION_TOKEN

{
  "name": "Development API Key",
  "expires_in": 2592000,
  "scopes": ["read:servers", "write:servers", "read:users"]
}`;

const createTokenResponse = `{
  "token": "mcpm_api_1a2b3c4d5e6f7g8h9i0j",
  "name": "Development API Key",
  "scopes": ["read:servers", "write:servers", "read:users"],
  "created_at": "2023-03-21T10:30:00Z",
  "expires_at": "2023-04-20T10:30:00Z"
}`;

const validateTokenExample = `GET /api/v1/auth/validate
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const validateTokenResponse = `{
  "valid": true,
  "token_info": {
    "user_id": "user-1",
    "scopes": ["read:servers", "write:servers", "read:users"],
    "expires_at": "2023-04-20T10:30:00Z"
  }
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

export default function AuthApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api/rest" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">认证 API</h1>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          认证 API 提供用户登录、令牌管理和权限验证功能。使用这些 API 可以创建安全的用户会话、
          生成和管理 API 令牌，以及验证请求的权限。
        </p>

        <div className="bg-muted p-4 rounded-md border mb-8">
          <div className="flex items-start">
            <ShieldCheck className="h-5 w-5 mr-2 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">认证方式</p>
              <p className="text-sm mt-1">
                MCPM 提供两种认证方式：
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc ml-5">
                <li><span className="font-medium">会话令牌</span> - 用于用户登录会话，有效期较短</li>
                <li><span className="font-medium">API 令牌</span> - 用于应用程序集成，可设置长期有效</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Lock className="mr-2 h-6 w-6" />
          认证端点
        </h2>

        <div className="space-y-12 mt-8">
          {/* 用户登录 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <UserCheck className="mr-2 h-5 w-5" />
              用户登录
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs mr-2">POST</span>
              <code className="text-sm bg-secondary p-1 rounded">/auth/login</code>
            </div>
            <p className="mb-4">
              使用用户名和密码进行身份验证，并获取会话令牌。
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
                    {loginExample}
                  </SyntaxHighlighter>
                  <CopyButton text={loginExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {loginResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={loginResponse} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 创建API令牌 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <Key className="mr-2 h-5 w-5" />
              创建 API 令牌
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs mr-2">POST</span>
              <code className="text-sm bg-secondary p-1 rounded">/auth/tokens</code>
            </div>
            <p className="mb-4">
              为当前登录用户创建一个长期有效的 API 令牌，用于第三方应用集成。
              需要有效的会话令牌。
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
                    {createTokenExample}
                  </SyntaxHighlighter>
                  <CopyButton text={createTokenExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {createTokenResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={createTokenResponse} />
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
                        <td className="py-2 pr-4"><code>name</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">令牌的描述性名称</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><code>expires_in</code></td>
                        <td className="py-2 pr-4">Integer</td>
                        <td className="py-2">令牌有效期（秒），最大值为 31536000（1年）</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><code>scopes</code></td>
                        <td className="py-2 pr-4">Array</td>
                        <td className="py-2">令牌权限范围列表</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 验证令牌 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <ShieldCheck className="mr-2 h-5 w-5" />
              验证令牌
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/auth/validate</code>
            </div>
            <p className="mb-4">
              验证当前令牌是否有效，并返回令牌的元数据信息。
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
                    {validateTokenExample}
                  </SyntaxHighlighter>
                  <CopyButton text={validateTokenExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {validateTokenResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={validateTokenResponse} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-10 mb-4">
          <Key className="mr-2 h-6 w-6" />
          权限范围
        </h2>
        <p className="mb-4">
          API 令牌可以被赋予特定的权限范围，以限制其访问权限。以下是可用的权限范围：
        </p>

        <div className="bg-card border rounded-md p-4 mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">范围</th>
                <th className="text-left pb-2">描述</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>read:servers</code></td>
                <td className="py-2">读取服务器信息的权限</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>write:servers</code></td>
                <td className="py-2">创建和修改服务器的权限</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>delete:servers</code></td>
                <td className="py-2">删除服务器的权限</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>read:users</code></td>
                <td className="py-2">读取用户信息的权限（需要管理员角色）</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code>write:users</code></td>
                <td className="py-2">创建和修改用户的权限（需要管理员角色）</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code>read:stats</code></td>
                <td className="py-2">读取统计数据的权限</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            安全最佳实践
          </h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>始终通过 HTTPS 传输认证凭据</li>
            <li>为不同应用和用例创建单独的 API 令牌</li>
            <li>仅授予令牌所需的最小权限范围</li>
            <li>定期轮换 API 令牌</li>
            <li>当不再需要时立即撤销令牌</li>
            <li>不要在客户端代码中嵌入 API 令牌</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 