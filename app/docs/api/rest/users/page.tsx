"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2,
  Copy,
  User,
  Shield,
  Users
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

// API示例
const getUsersExample = `GET /api/v1/users
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const getUsersResponse = `{
  "users": [
    {
      "id": "user-1",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "admin",
      "created_at": "2023-01-15T08:30:00Z",
      "updated_at": "2023-03-20T14:22:15Z"
    },
    {
      "id": "user-2",
      "username": "jane_smith",
      "email": "jane@example.com",
      "role": "user",
      "created_at": "2023-02-05T10:15:00Z",
      "updated_at": "2023-03-18T09:45:30Z"
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 10
}`;

const getUserExample = `GET /api/v1/users/:id
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const getUserResponse = `{
  "id": "user-1",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "admin",
  "profile": {
    "full_name": "John Doe",
    "avatar_url": "https://api.mcpm.com/images/avatars/john.jpg",
    "bio": "MCP Developer and Admin"
  },
  "settings": {
    "notifications_enabled": true,
    "two_factor_enabled": true
  },
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-03-20T14:22:15Z"
}`;

const createUserExample = `POST /api/v1/users
Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "role": "user",
  "profile": {
    "full_name": "New User",
    "bio": "MCP enthusiast"
  }
}`;

const createUserResponse = `{
  "id": "user-3",
  "username": "new_user",
  "email": "newuser@example.com",
  "role": "user",
  "profile": {
    "full_name": "New User",
    "bio": "MCP enthusiast",
    "avatar_url": null
  },
  "created_at": "2023-03-21T10:30:00Z",
  "updated_at": "2023-03-21T10:30:00Z"
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

export default function UsersApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api/rest" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">用户管理 API</h1>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <Callout className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 mr-2 mt-0.5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium">管理员权限</p>
              <p className="text-sm">用户管理 API 需要管理员级别的 API 密钥才能访问。</p>
            </div>
          </div>
        </Callout>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Users className="mr-2 h-6 w-6" />
          用户管理端点
        </h2>
        <p>
          下面是用户管理 API 提供的所有端点。这些 API 使用标准 REST 设计原则，
          并通过 API 令牌进行授权。
        </p>

        <div className="space-y-12 mt-8">
          {/* 获取用户列表 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <User className="mr-2 h-5 w-5" />
              获取用户列表
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/users</code>
            </div>
            <p className="mb-4">
              获取系统中注册的所有用户列表。结果支持分页、排序和过滤。
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
                    {getUsersExample}
                  </SyntaxHighlighter>
                  <CopyButton text={getUsersExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {getUsersResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={getUsersResponse} />
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
                        <td className="py-2 pr-4"><code>role</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">按角色过滤 (admin, user, guest)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><code>search</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">按用户名或邮箱搜索</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 获取特定用户 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <User className="mr-2 h-5 w-5" />
              获取特定用户
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/users/:id</code>
            </div>
            <p className="mb-4">
              获取指定用户的详细信息，包括个人资料和设置。
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
                    {getUserExample}
                  </SyntaxHighlighter>
                  <CopyButton text={getUserExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {getUserResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={getUserResponse} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 创建用户 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <User className="mr-2 h-5 w-5" />
              创建用户
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs mr-2">POST</span>
              <code className="text-sm bg-secondary p-1 rounded">/users</code>
            </div>
            <p className="mb-4">
              在系统中创建新用户账户。
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
                    {createUserExample}
                  </SyntaxHighlighter>
                  <CopyButton text={createUserExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {createUserResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={createUserResponse} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-10 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium mb-2">了解更多</h3>
          <p className="mb-2">
            这里仅展示了用户管理 API 的部分功能。完整的 API 功能还包括：
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>更新用户信息</li>
            <li>删除用户</li>
            <li>管理用户权限</li>
            <li>用户群组管理</li>
            <li>用户活动日志</li>
          </ul>
          <p className="mt-4">
            更多详细信息，请参考我们的<Link href="/docs/api/rest" className="text-primary hover:underline font-medium">完整 API 文档</Link>。
          </p>
        </div>
      </div>
    </div>
  );
} 