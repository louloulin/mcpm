"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2,
  Copy,
  Code,
  Database,
  Server
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
const queryUsersExample = `query GetUsers($first: Int, $filter: UserFilter) {
  users(first: $first, filter: $filter) {
    edges {
      node {
        id
        username
        email
        role
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}

# 变量
{
  "first": 10,
  "filter": {
    "role": "admin"
  }
}`;

const queryStatsExample = `query GetStatistics {
  statsOverview {
    servers {
      total
      active
      inactive
    }
    users {
      total
      activeToday
      activeWeek
      activeMonth
    }
    requests {
      today
      week
      month
      avgResponseTime
    }
    resources {
      cpuUsage
      memoryUsage
      storageUsage
    }
    timestamp
  }
  
  popularServers(limit: 5) {
    id
    name
    description
    downloads
    rating
  }
}`;

const mutationLoginExample = `mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    user {
      id
      username
      email
      role
    }
    expiresAt
  }
}

# 变量
{
  "username": "admin",
  "password": "securepassword123"
}`;

const mutationCreateServerExample = `mutation CreateServer($input: CreateServerInput!) {
  createServer(input: $input) {
    id
    key
    name
    description
    version
    createdAt
    updatedAt
  }
}

# 变量
{
  "input": {
    "key": "my-new-server",
    "name": "My New Server",
    "description": "A new server for testing",
    "version": "1.0.0",
    "tags": ["test", "development"]
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

export default function GraphQLApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">GraphQL API 文档</h1>
        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          即将推出
        </span>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <Callout className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
          <p className="font-medium">此 API 目前处于开发阶段</p>
          <p className="text-sm">GraphQL API 正在构建中，可能会有所变动。我们欢迎您提前体验并提供反馈。</p>
        </Callout>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Code className="mr-2 h-6 w-6" />
          GraphQL 简介
        </h2>
        <p>
          MCPM GraphQL API 提供了一种灵活的方式来查询和修改 MCPM 服务器资源。
          与 REST API 不同，GraphQL 允许您精确指定需要的数据，避免过度获取或不足获取问题。
        </p>
        <p>
          GraphQL API 端点位于：
          <code className="text-sm bg-secondary p-1 rounded">https://api.mcpm.com/graphql</code>
        </p>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Server className="mr-2 h-6 w-6" />
          认证
        </h2>
        <p>
          与 REST API 相同，GraphQL API 也需要通过 HTTP 头部的 <code>Authorization</code> 字段提供 API 令牌：
        </p>
        <div className="bg-card border rounded-md p-4">
          <code>Authorization: Bearer YOUR_API_TOKEN</code>
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Database className="mr-2 h-6 w-6" />
          查询示例
        </h2>
        <p>
          以下是一些常用查询的示例。您可以使用 GraphQL 客户端（如 GraphiQL 或 Apollo Studio Explorer）
          来探索完整的 API 模式和执行查询。
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">查询用户列表</h3>
        <Tabs defaultValue="query">
          <TabsList>
            <TabsTrigger value="query">查询</TabsTrigger>
            <TabsTrigger value="response">响应</TabsTrigger>
          </TabsList>
          <TabsContent value="query">
            <div className="relative">
              <SyntaxHighlighter 
                language="graphql" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {queryUsersExample}
              </SyntaxHighlighter>
              <CopyButton text={queryUsersExample} />
            </div>
          </TabsContent>
          <TabsContent value="response">
            <div className="relative">
              <SyntaxHighlighter 
                language="json" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {`{
  "data": {
    "users": {
      "edges": [
        {
          "node": {
            "id": "user-1",
            "username": "admin",
            "email": "admin@example.com",
            "role": "admin",
            "createdAt": "2023-01-01T00:00:00Z"
          },
          "cursor": "Y3Vyc29yOnVzZXItMQ=="
        },
        {
          "node": {
            "id": "user-2",
            "username": "developer",
            "email": "dev@example.com",
            "role": "user",
            "createdAt": "2023-01-15T08:30:00Z"
          },
          "cursor": "Y3Vyc29yOnVzZXItMg=="
        }
      ],
      "pageInfo": {
        "hasNextPage": false,
        "hasPreviousPage": false,
        "startCursor": "Y3Vyc29yOnVzZXItMQ==",
        "endCursor": "Y3Vyc29yOnVzZXItMg=="
      },
      "totalCount": 2
    }
  }
}`}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>

        <h3 className="text-xl font-semibold mt-6 mb-3">获取统计数据</h3>
        <Tabs defaultValue="query">
          <TabsList>
            <TabsTrigger value="query">查询</TabsTrigger>
            <TabsTrigger value="response">响应</TabsTrigger>
          </TabsList>
          <TabsContent value="query">
            <div className="relative">
              <SyntaxHighlighter 
                language="graphql" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {queryStatsExample}
              </SyntaxHighlighter>
              <CopyButton text={queryStatsExample} />
            </div>
          </TabsContent>
          <TabsContent value="response">
            <div className="relative">
              <SyntaxHighlighter 
                language="json" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {`{
  "data": {
    "statsOverview": {
      "servers": {
        "total": 128,
        "active": 95,
        "inactive": 33
      },
      "users": {
        "total": 3245,
        "activeToday": 876,
        "activeWeek": 2198,
        "activeMonth": 2735
      },
      "requests": {
        "today": 56789,
        "week": 376521,
        "month": 1456789,
        "avgResponseTime": 87.5
      },
      "resources": {
        "cpuUsage": 42.3,
        "memoryUsage": 68.7,
        "storageUsage": 57.1
      },
      "timestamp": "2023-03-21T10:30:00Z"
    },
    "popularServers": [
      {
        "id": "server-1",
        "name": "Production Server",
        "description": "Main production environment",
        "downloads": 1245,
        "rating": 4.7
      },
      {
        "id": "server-2",
        "name": "Development Server",
        "description": "Development and testing environment",
        "downloads": 856,
        "rating": 4.2
      }
    ]
  }
}`}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Code className="mr-2 h-6 w-6" />
          变更示例
        </h2>
        <p>
          GraphQL API 也支持修改数据的操作（变更）。以下是一些常用变更的示例。
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">用户登录</h3>
        <Tabs defaultValue="mutation">
          <TabsList>
            <TabsTrigger value="mutation">变更</TabsTrigger>
            <TabsTrigger value="response">响应</TabsTrigger>
          </TabsList>
          <TabsContent value="mutation">
            <div className="relative">
              <SyntaxHighlighter 
                language="graphql" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {mutationLoginExample}
              </SyntaxHighlighter>
              <CopyButton text={mutationLoginExample} />
            </div>
          </TabsContent>
          <TabsContent value="response">
            <div className="relative">
              <SyntaxHighlighter 
                language="json" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {`{
  "data": {
    "login": {
      "token": "example-token",
      "user": {
        "id": "user-1",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin"
      },
      "expiresAt": "2023-03-22T10:30:00Z"
    }
  }
}`}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>

        <h3 className="text-xl font-semibold mt-6 mb-3">创建服务器</h3>
        <Tabs defaultValue="mutation">
          <TabsList>
            <TabsTrigger value="mutation">变更</TabsTrigger>
            <TabsTrigger value="response">响应</TabsTrigger>
          </TabsList>
          <TabsContent value="mutation">
            <div className="relative">
              <SyntaxHighlighter 
                language="graphql" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {mutationCreateServerExample}
              </SyntaxHighlighter>
              <CopyButton text={mutationCreateServerExample} />
            </div>
          </TabsContent>
          <TabsContent value="response">
            <div className="relative">
              <SyntaxHighlighter 
                language="json" 
                style={vscDarkPlus}
                customStyle={{borderRadius: '0.5rem'}}
              >
                {`{
  "data": {
    "createServer": {
      "id": "server-3",
      "key": "my-new-server",
      "name": "My New Server",
      "description": "A new server for testing",
      "version": "1.0.0",
      "createdAt": "2023-03-21T10:30:00Z",
      "updatedAt": "2023-03-21T10:30:00Z"
    }
  }
}`}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        </Tabs>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Database className="mr-2 h-6 w-6" />
          模式探索
        </h2>
        <p>
          完整的 GraphQL 模式可以通过内省查询获取。您可以使用标准的 GraphQL 客户端（如 GraphiQL 或 Apollo Studio Explorer）
          来探索完整的 API 模式，包括所有类型、查询和变更。
        </p>
        <p>
          一旦 GraphQL API 正式发布，我们将提供一个在线的 GraphQL 模式探索器，方便您浏览和测试 API。
        </p>

        <div className="mt-10 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium mb-2">GraphQL 优势</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>精确获取所需数据，避免过度获取</li>
            <li>单一请求获取多个资源，减少网络请求</li>
            <li>强类型模式，提供良好的开发体验</li>
            <li>丰富的工具生态，包括代码生成和类型安全</li>
            <li>内省能力，支持自动文档和探索</li>
          </ul>
        </div>

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