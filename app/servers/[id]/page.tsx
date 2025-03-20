"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Star, Github, Calendar, Package, ChevronLeft, User, FileCode } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// 用于测试的模拟数据，实际应用中应该从API获取
const MOCK_SERVERS = [
  {
    id: 'server-1',
    name: '简单问候MCP服务器',
    description: '基础的问候服务，提供友好的API接口',
    version: '1.0.0',
    downloads: 1240,
    rating: 4.5,
    author: {
      id: 'user1',
      name: '张三',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=1',
    },
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-03-20T00:00:00Z',
    tags: ['入门', '示例', '简单'],
    license: 'MIT',
    tools: [
      {
        id: 'tool-1',
        name: 'greeting',
        description: '返回问候消息',
        inputs: [
          {
            name: 'name',
            type: 'string',
            description: '用户名称',
            required: true
          },
          {
            name: 'language',
            type: 'string',
            description: '语言代码',
            required: false,
            default: 'zh-CN'
          }
        ],
        output: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '问候消息'
            }
          }
        }
      }
    ],
    examples: [
      {
        title: '基本问候',
        code: `import { MCPClient } from 'mcp-client';

// 创建MCP客户端
const client = new MCPClient({
  serverUrl: 'https://example.com/greeting-server'
});

// 调用问候工具
const response = await client.call('greeting', {
  name: '世界',
  language: 'zh-CN'
});

console.log(response.message);  // 输出: "你好，世界！"`,
      },
      {
        title: '多语言问候',
        code: `import { MCPClient } from 'mcp-client';

const client = new MCPClient({
  serverUrl: 'https://example.com/greeting-server'
});

// 英语问候
const enResponse = await client.call('greeting', {
  name: 'World',
  language: 'en-US'
});
console.log(enResponse.message);  // 输出: "Hello, World!"

// 日语问候
const jpResponse = await client.call('greeting', {
  name: '世界',
  language: 'ja-JP'
});
console.log(jpResponse.message);  // 输出: "こんにちは、世界！"`,
      }
    ],
    installCommand: 'npm install greeting-mcp-server',
    startCommand: 'npx greeting-mcp-server',
    repositoryUrl: 'https://github.com/user1/greeting-mcp-server',
    documentation: 'https://greeting-mcp-server.docs.com'
  },
  {
    id: 'server-2',
    name: '天气查询MCP服务器',
    description: '获取全球各主要城市的实时天气信息和预报',
    version: '2.1.0',
    downloads: 3450,
    rating: 4.8,
    author: {
      id: 'user2',
      name: '李四',
      role: 'organization',
      avatarUrl: 'https://i.pravatar.cc/100?u=2',
    },
    createdAt: '2023-02-20T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
    tags: ['天气', 'API', '实用'],
    license: 'Apache-2.0',
    tools: [
      {
        id: 'tool-1',
        name: 'getCurrentWeather',
        description: '获取当前天气',
        inputs: [
          {
            name: 'city',
            type: 'string',
            description: '城市名称',
            required: true
          }
        ],
        output: {
          type: 'object',
          properties: {
            temperature: {
              type: 'number',
              description: '温度(摄氏度)'
            },
            condition: {
              type: 'string',
              description: '天气状况'
            }
          }
        }
      }
    ],
    examples: [
      {
        title: '获取北京天气',
        code: `import { MCPClient } from 'mcp-client';

const client = new MCPClient({
  serverUrl: 'https://example.com/weather-server'
});

const weather = await client.call('getCurrentWeather', {
  city: '北京'
});

console.log(\`当前温度: \${weather.temperature}°C, 天气: \${weather.condition}\`);`,
      }
    ],
    installCommand: 'npm install weather-mcp-server',
    startCommand: 'npx weather-mcp-server',
    repositoryUrl: 'https://github.com/user2/weather-mcp-server',
    documentation: 'https://weather-mcp-server.docs.com'
  }
];

// 类型定义
interface ServerTool {
  id: string;
  name: string;
  description: string;
  inputs: any[];
  output: any;
}

interface ServerAuthor {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

interface CodeExample {
  title: string;
  code: string;
}

interface ServerData {
  id: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  author: ServerAuthor;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  license: string;
  tools: ServerTool[];
  examples: CodeExample[];
  installCommand: string;
  startCommand: string;
  repositoryUrl: string;
  documentation: string;
}

export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const serverId = params.id;
  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  console.log("Server ID:", serverId); // 添加日志以帮助调试

  useEffect(() => {
    // 模拟API请求
    const fetchServer = async () => {
      try {
        setLoading(true);
        
        // 在实际应用中，这里会调用API
        // const response = await fetch(`/api/servers/${params.id}`);
        // const data = await response.json();
        
        // 使用模拟数据
        setTimeout(() => {
          const foundServer = MOCK_SERVERS.find(s => s.id === serverId);
          if (foundServer) {
            setServer(foundServer);
          } else {
            setError('未找到指定的MCP服务器');
          }
          setLoading(false);
        }, 1000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError('加载MCP服务器详情失败');
        setLoading(false);
      }
    };

    fetchServer();
  }, [serverId]);

  // 渲染服务器信息
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin mb-4">
            <FileCode className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">加载MCP服务器详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/servers')}>
            返回服务器列表
          </Button>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <p className="text-lg mb-4">未找到指定的MCP服务器</p>
          <Button variant="outline" onClick={() => router.push('/servers')}>
            返回服务器列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 返回按钮 */}
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push('/servers')}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      {/* 服务器头部信息 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{server.name}</h1>
          <p className="text-muted-foreground mb-4">{server.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {server.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          
          <div className="flex items-center mb-4">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={server.author.avatarUrl} alt={server.author.name} />
              <AvatarFallback>{server.author.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm text-muted-foreground">开发者: </span>
              <span className="font-medium">{server.author.name}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <Download className="mr-1 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{server.downloads.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">下载</span>
            </div>
            <div className="flex items-center">
              <Star className="mr-1 h-5 w-5 text-yellow-500" />
              <span className="font-medium">{server.rating}</span>
              <span className="text-muted-foreground ml-1">评分</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">更新于 </span>
              <span className="ml-1">{new Date(server.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Card className="md:col-span-1">
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">版本</p>
              <div className="flex items-center">
                <Package className="mr-1 h-4 w-4 text-muted-foreground" />
                <span>v{server.version}</span>
                <Badge variant="outline" className="ml-2">{server.license}</Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">安装命令</p>
              <div className="bg-muted rounded-md p-2 text-sm font-mono overflow-x-auto">
                {server.installCommand}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">启动命令</p>
              <div className="bg-muted rounded-md p-2 text-sm font-mono overflow-x-auto">
                {server.startCommand}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              {server.repositoryUrl && (
                <Button variant="outline" size="sm" asChild className="justify-start">
                  <Link href={server.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    查看源代码
                  </Link>
                </Button>
              )}
              
              {server.documentation && (
                <Button variant="outline" size="sm" asChild className="justify-start">
                  <Link href={server.documentation} target="_blank" rel="noopener noreferrer">
                    <FileCode className="mr-2 h-4 w-4" />
                    查看文档
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="tools">功能与API</TabsTrigger>
          <TabsTrigger value="examples">使用示例</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  发布信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">首次发布：</span>
                    <span className="ml-2">{new Date(server.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">最近更新：</span>
                    <span className="ml-2">{new Date(server.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">当前版本：</span>
                    <span className="ml-2">v{server.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
                
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  开发者信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={server.author.avatarUrl} alt={server.author.name} />
                    <AvatarFallback>{server.author.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{server.author.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{server.author.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileCode className="mr-2 h-5 w-5" />
                功能概述
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{server.description}</p>
              <p className="text-sm text-muted-foreground">
                此MCP服务器提供了 {server.tools.length} 个工具，可用于扩展AI模型的能力。
                查看&quot;功能与API&quot;标签页了解详情。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>API工具列表</CardTitle>
              <CardDescription>
                此MCP服务器提供以下工具，可集成到AI模型中
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {server.tools.map(tool => (
                  <div key={tool.id} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">{tool.name}</h3>
                      <p className="text-muted-foreground">{tool.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">输入参数</h4>
                      <div className="space-y-3">
                        {tool.inputs.map((input, index) => (
                          <div key={index} className="grid md:grid-cols-3 gap-1 md:gap-4 border-b pb-3">
                            <div>
                              <span className="font-medium">{input.name}</span>
                              {input.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <div className="text-sm">
                              <Badge variant="outline">{input.type}</Badge>
                              {input.default && (
                                <span className="ml-2 text-muted-foreground">
                                  默认值: {input.default}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {input.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">输出格式</h4>
                      <div className="rounded-md bg-muted p-4">
                        <SyntaxHighlighter
                          language="json"
                          style={vs2015}
                          customStyle={{ background: 'transparent' }}
                        >
                          {JSON.stringify(tool.output, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                    
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-8">
          {server.examples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <SyntaxHighlighter
                  language="javascript"
                  style={vs2015}
                  className="rounded-md"
                >
                  {example.code}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 