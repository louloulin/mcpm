"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2,
  Copy,
  BarChart,
  AreaChart,
  PieChart,
  LineChart
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// API示例
const getStatsOverviewExample = `GET /api/v1/stats/overview
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const getStatsOverviewResponse = `{
  "servers": {
    "total": 128,
    "active": 95,
    "inactive": 33
  },
  "users": {
    "total": 3245,
    "active_today": 876,
    "active_week": 2198,
    "active_month": 2735
  },
  "requests": {
    "today": 56789,
    "week": 376521,
    "month": 1456789,
    "avg_response_time": 87.5
  },
  "resources": {
    "cpu_usage": 42.3,
    "memory_usage": 68.7,
    "storage_usage": 57.1
  },
  "timestamp": "2023-03-21T10:30:00Z"
}`;

const getStatsServersExample = `GET /api/v1/stats/servers/popular?period=month&limit=5
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const getStatsServersResponse = `{
  "period": "month",
  "servers": [
    {
      "id": "server-123",
      "name": "Production API Server",
      "requests": 245678,
      "avg_response_time": 62.4,
      "uptime": 99.98
    },
    {
      "id": "server-456",
      "name": "Media Processing Server",
      "requests": 189345,
      "avg_response_time": 105.8,
      "uptime": 99.95
    },
    {
      "id": "server-789",
      "name": "Authentication Server",
      "requests": 176543,
      "avg_response_time": 45.2,
      "uptime": 100.0
    },
    {
      "id": "server-101",
      "name": "Database Query Server",
      "requests": 158742,
      "avg_response_time": 78.6,
      "uptime": 99.90
    },
    {
      "id": "server-112",
      "name": "Analytics Processing Server",
      "requests": 132156,
      "avg_response_time": 125.3,
      "uptime": 99.85
    }
  ],
  "timestamp": "2023-03-21T10:30:00Z"
}`;

const getStatsHistoricalExample = `GET /api/v1/stats/historical?metric=requests&period=week&interval=day
Accept: application/json
Authorization: Bearer YOUR_API_TOKEN`;

const getStatsHistoricalResponse = `{
  "metric": "requests",
  "period": "week",
  "interval": "day",
  "data": [
    {
      "timestamp": "2023-03-15T00:00:00Z",
      "value": 52456
    },
    {
      "timestamp": "2023-03-16T00:00:00Z",
      "value": 48721
    },
    {
      "timestamp": "2023-03-17T00:00:00Z",
      "value": 51234
    },
    {
      "timestamp": "2023-03-18T00:00:00Z",
      "value": 43567
    },
    {
      "timestamp": "2023-03-19T00:00:00Z",
      "value": 38912
    },
    {
      "timestamp": "2023-03-20T00:00:00Z",
      "value": 54321
    },
    {
      "timestamp": "2023-03-21T00:00:00Z",
      "value": 56789
    }
  ],
  "total": 345980,
  "average": 49425.7
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

export default function StatsApiPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/docs/api/rest" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">数据统计 API</h1>
      </div>

      <Separator className="my-6" />

      <div className="prose max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          数据统计 API 提供平台使用情况的指标和分析数据，用于监控、报告和数据可视化。
          您可以获取概览数据、历史趋势和特定资源的详细统计信息。
        </p>

        <h2 className="flex items-center text-2xl font-semibold mt-8 mb-4">
          <BarChart className="mr-2 h-6 w-6" />
          统计数据端点
        </h2>

        <div className="space-y-12 mt-8">
          {/* 概览统计 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <PieChart className="mr-2 h-5 w-5" />
              平台概览统计
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/stats/overview</code>
            </div>
            <p className="mb-4">
              获取平台的概览统计信息，包括服务器数量、用户活跃度、请求量和资源使用情况。
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
                    {getStatsOverviewExample}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsOverviewExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {getStatsOverviewResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsOverviewResponse} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 热门服务器 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <AreaChart className="mr-2 h-5 w-5" />
              热门服务器统计
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/stats/servers/popular</code>
            </div>
            <p className="mb-4">
              获取平台上使用最频繁的服务器列表及其性能指标。
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
                    {getStatsServersExample}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsServersExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {getStatsServersResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsServersResponse} />
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
                        <td className="py-2 pr-4"><code>period</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">统计周期 (day, week, month, year)，默认为 week</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><code>limit</code></td>
                        <td className="py-2 pr-4">Integer</td>
                        <td className="py-2">返回服务器数量，默认为 10，最大为 50</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><code>sort</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">排序指标 (requests, response_time, uptime)，默认为 requests</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 历史趋势数据 */}
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-4">
              <LineChart className="mr-2 h-5 w-5" />
              历史趋势数据
            </h3>
            <div className="flex items-center mb-4">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">GET</span>
              <code className="text-sm bg-secondary p-1 rounded">/stats/historical</code>
            </div>
            <p className="mb-4">
              获取特定指标在一段时间内的历史趋势数据，用于图表和趋势分析。
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
                    {getStatsHistoricalExample}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsHistoricalExample} />
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="relative">
                  <SyntaxHighlighter 
                    language="json" 
                    style={vscDarkPlus}
                    customStyle={{borderRadius: '0.5rem'}}
                  >
                    {getStatsHistoricalResponse}
                  </SyntaxHighlighter>
                  <CopyButton text={getStatsHistoricalResponse} />
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
                        <td className="py-2 pr-4"><code>metric</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">要分析的指标 (requests, cpu, memory, response_time)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><code>period</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">时间跨度 (day, week, month, year)，默认为 week</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><code>interval</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">采样间隔 (minute, hour, day, week)，默认与 period 相关</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><code>server_id</code></td>
                        <td className="py-2 pr-4">String</td>
                        <td className="py-2">可选的服务器 ID，用于获取特定服务器的历史数据</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-10 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium mb-2">数据导出</h3>
          <p className="mb-2">
            除了通过 API 获取数据，您还可以将统计数据导出为 CSV 或 JSON 格式进行进一步分析。
            只需在请求参数中添加 <code>format=csv</code> 或 <code>format=json</code> 参数即可。
          </p>
          <p>
            <span className="font-medium">示例：</span>
            <code className="ml-2 text-sm bg-secondary p-1 rounded-sm">/api/v1/stats/historical?metric=requests&period=month&interval=day&format=csv</code>
          </p>
        </div>
      </div>
    </div>
  );
} 