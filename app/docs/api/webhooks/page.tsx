"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2,
  Copy,
  Webhook,
  Shield,
  Bell,
  Code
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

// 代码示例
const createWebhookExample = `curl -X POST \\
  https://api.mcpm.com/api/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/webhook",
    "events": ["server.created", "server.updated", "server.deleted"],
    "description": "My production webhook"
  }'`;

const webhookPayloadExample = `{
  "id": "evt_1234567890",
  "type": "server.created",
  "created_at": "2023-03-21T15:30:00Z",
  "data": {
    "id": "srv-abcdef123456",
    "key": "my-awesome-server",
    "name": "My Awesome Server",
    "version": "1.0.0",
    "author": {
      "id": "user-123",
      "username": "developer"
    },
    "description": "An awesome MCP server for production use"
  }
}`;

const verifySignatureExample = `// Node.js 示例
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-mcpm-signature'];
  const timestamp = req.headers['x-mcpm-timestamp'];
  
  // 验证时间戳以防止重放攻击
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(timestamp) > 300) { // 5分钟过期
    return res.status(400).send('Timestamp too old');
  }
  
  // 验证签名
  const webhookSecret = 'YOUR_WEBHOOK_SECRET';
  const payload = req.rawBody;
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  if (signature === \`sha256=\${expectedSignature}\`) {
    // 签名验证成功
    const event = req.body;
    
    // 处理不同事件类型
    switch (event.type) {
      case 'server.created':
        // 处理服务器创建事件
        break;
      case 'server.updated':
        // 处理服务器更新事件
        break;
      // ...其他事件类型
    }
    
    res.status(200).send('Webhook received');
  } else {
    // 签名验证失败
    res.status(401).send('Invalid signature');
  }
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});`;

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

export default function WebhooksApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Webhooks API 文档</h1>
        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          即将推出
        </span>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <Callout className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
          <p className="font-medium">此 API 目前处于开发阶段</p>
          <p className="text-sm">Webhooks API 正在构建中，可能会有所变动。我们欢迎您提前体验并提供反馈。</p>
        </Callout>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Webhook className="mr-2 h-6 w-6" />
          Webhooks 简介
        </h2>
        <p>
          MCPM Webhooks 允许您的应用接收实时事件通知。当特定事件发生在 MCPM 平台上时，我们会向您配置的 URL 
          发送 HTTP POST 请求，通知您的应用实时做出响应。
        </p>
        <p>
          Webhooks 是构建集成和自动化工作流的理想方式，可以让您的应用实时响应 MCPM 平台上的事件，无需不断轮询 API。
        </p>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Bell className="mr-2 h-6 w-6" />
          支持的事件类型
        </h2>
        <p>
          MCPM Webhooks 支持多种事件类型，每种类型代表平台上的特定操作或变更：
        </p>

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="server-events">
            <AccordionTrigger className="text-lg font-medium">服务器事件</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3">
                <li>
                  <strong>server.created</strong> - 新服务器被创建
                </li>
                <li>
                  <strong>server.updated</strong> - 服务器信息被更新
                </li>
                <li>
                  <strong>server.deleted</strong> - 服务器被删除
                </li>
                <li>
                  <strong>server.published</strong> - 服务器被发布到公共目录
                </li>
                <li>
                  <strong>server.version.released</strong> - 服务器发布了新版本
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="user-events">
            <AccordionTrigger className="text-lg font-medium">用户事件</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3">
                <li>
                  <strong>user.registered</strong> - 新用户注册
                </li>
                <li>
                  <strong>user.updated</strong> - 用户信息更新
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="installation-events">
            <AccordionTrigger className="text-lg font-medium">安装事件</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3">
                <li>
                  <strong>installation.created</strong> - 服务器被安装
                </li>
                <li>
                  <strong>installation.updated</strong> - 服务器安装被更新
                </li>
                <li>
                  <strong>installation.deleted</strong> - 服务器被卸载
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Code className="mr-2 h-6 w-6" />
          创建和管理 Webhooks
        </h2>
        <p>
          您可以通过 REST API 创建和管理 Webhooks。以下是创建 Webhook 的示例：
        </p>

        <div className="relative mt-4">
          <SyntaxHighlighter 
            language="bash" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {createWebhookExample}
          </SyntaxHighlighter>
          <CopyButton text={createWebhookExample} />
        </div>

        <p className="mt-6">成功的响应示例：</p>

        <div className="relative mt-2">
          <SyntaxHighlighter 
            language="json" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {`{
  "id": "webhook-1234567890",
  "url": "https://example.com/webhook",
  "events": ["server.created", "server.updated", "server.deleted"],
  "description": "My production webhook",
  "secret": "whsec_abcdefghijklmnopqrstuvwxyz123456",
  "active": true,
  "created_at": "2023-03-21T15:00:00Z"
}`}
          </SyntaxHighlighter>
        </div>

        <div className="p-4 mt-6 bg-card border rounded-md">
          <h3 className="text-lg font-medium mb-2">Webhook 配置参数</h3>
          <ul className="space-y-4">
            <li>
              <code className="font-mono bg-secondary px-1 rounded">url</code> - 
              <span className="ml-2">接收 Webhook 事件的 URL，必须是有效的 HTTPS URL</span>
            </li>
            <li>
              <code className="font-mono bg-secondary px-1 rounded">events</code> - 
              <span className="ml-2">需要订阅的事件类型数组</span>
            </li>
            <li>
              <code className="font-mono bg-secondary px-1 rounded">description</code> - 
              <span className="ml-2">(可选) Webhook 的描述，帮助您识别不同的 Webhook</span>
            </li>
          </ul>
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Bell className="mr-2 h-6 w-6" />
          Webhook 事件有效载荷
        </h2>
        <p>
          当事件触发时，MCPM 会向您配置的 URL 发送 HTTP POST 请求，包含以下格式的 JSON 有效载荷：
        </p>

        <div className="relative mt-4">
          <SyntaxHighlighter 
            language="json" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {webhookPayloadExample}
          </SyntaxHighlighter>
          <CopyButton text={webhookPayloadExample} />
        </div>

        <p className="mt-6">每个事件有效载荷包含以下字段：</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li><code className="font-mono bg-secondary px-1 rounded">id</code> - 事件的唯一标识符</li>
          <li><code className="font-mono bg-secondary px-1 rounded">type</code> - 事件类型</li>
          <li><code className="font-mono bg-secondary px-1 rounded">created_at</code> - 事件创建时间 (ISO 8601 格式)</li>
          <li><code className="font-mono bg-secondary px-1 rounded">data</code> - 包含事件相关数据的对象，根据事件类型有所不同</li>
        </ul>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Shield className="mr-2 h-6 w-6" />
          验证 Webhook 签名
        </h2>
        <p>
          为了确保 Webhook 请求的安全性和真实性，MCPM 使用 HMAC-SHA256 签名机制。每个 Webhook 请求
          都包含两个额外的 HTTP 头：
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li><code className="font-mono bg-secondary px-1 rounded">X-MCPM-Signature</code> - HMAC-SHA256 签名</li>
          <li><code className="font-mono bg-secondary px-1 rounded">X-MCPM-Timestamp</code> - 请求时间戳 (Unix 时间)</li>
        </ul>

        <p className="mt-4">
          您应该在接收 Webhook 请求时验证这些签名，以确保请求确实来自 MCPM 平台，并且没有被篡改。
          以下是一个 Node.js 验证示例：
        </p>

        <div className="relative mt-4">
          <SyntaxHighlighter 
            language="javascript" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {verifySignatureExample}
          </SyntaxHighlighter>
          <CopyButton text={verifySignatureExample} />
        </div>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Bell className="mr-2 h-6 w-6" />
          最佳实践
        </h2>

        <ul className="list-disc pl-6 mt-2 space-y-4">
          <li>
            <strong>响应及时</strong> - Webhook 请求有 5 秒的超时时间。如果您的服务器未能在此时间内响应，
            MCPM 将视为失败并可能尝试重新发送请求。
          </li>
          <li>
            <strong>验证签名</strong> - 始终验证请求签名，以确保请求来自 MCPM 并且没有被篡改。
          </li>
          <li>
            <strong>处理重复事件</strong> - 在某些情况下，您可能会收到相同的事件多次。确保您的处理逻辑是幂等的。
          </li>
          <li>
            <strong>检查时间戳</strong> - 验证请求时间戳以防止重放攻击。
          </li>
          <li>
            <strong>记录 Webhook 请求</strong> - 记录接收到的 Webhook 请求，以便于调试和监控。
          </li>
        </ul>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <Code className="mr-2 h-6 w-6" />
          测试 Webhooks
        </h2>
        <p>
          在集成 Webhooks 的过程中，您可能希望测试接收事件的能力。MCPM 提供了一个测试端点，让您可以
          模拟触发事件并发送到您的 Webhook URL：
        </p>

        <div className="relative mt-4">
          <SyntaxHighlighter 
            language="bash" 
            style={vscDarkPlus}
            customStyle={{borderRadius: '0.5rem'}}
          >
            {`curl -X POST \\
  https://api.mcpm.com/api/v1/webhooks/events \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "server.created",
    "payload": {
      "id": "srv-test123",
      "key": "test-server",
      "name": "Test Server",
      "version": "1.0.0"
    }
  }'`}
          </SyntaxHighlighter>
          <CopyButton text={`curl -X POST \\
  https://api.mcpm.com/api/v1/webhooks/events \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "server.created",
    "payload": {
      "id": "srv-test123",
      "key": "test-server",
      "name": "Test Server",
      "version": "1.0.0"
    }
  }'`} />
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