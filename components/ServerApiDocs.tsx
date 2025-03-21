import React, { useState, useEffect } from 'react';
import { Server } from '../lib/types';
import NextLink from 'next/link';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Code, Book } from "lucide-react";

interface ServerApiDocsProps {
  server: Server;
  showFullDocs?: boolean;
}

/**
 * 服务器API文档组件
 * 
 * 该组件用于显示服务器的API文档，包括：
 * - 文档概述
 * - 嵌入式文档查看器
 * - 在新窗口中打开文档的链接
 */
const ServerApiDocs: React.FC<ServerApiDocsProps> = ({ server, showFullDocs = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasApiDocs, setHasApiDocs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 检查服务器是否有API文档
  useEffect(() => {
    const checkApiDocs = async () => {
      try {
        setLoading(true);
        
        // 发送请求检查API文档是否存在
        const res = await fetch(`/api/docs/${server.id}`);
        
        if (res.ok) {
          setHasApiDocs(true);
        } else {
          setHasApiDocs(false);
          
          // 如果是404错误（文档不存在），不显示错误消息
          if (res.status !== 404) {
            const data = await res.json();
            setError(data.error || '无法加载API文档');
          }
        }
      } catch (err) {
        console.error('检查API文档时出错:', err);
        setError('检查API文档时出错');
      } finally {
        setLoading(false);
      }
    };
    
    checkApiDocs();
  }, [server.id]);
  
  // 如果正在加载
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4">正在检查API文档...</p>
      </div>
    );
  }
  
  // 如果发生错误
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>加载出错!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // 如果没有API文档
  if (!hasApiDocs) {
    return (
      <div className="p-4 border rounded-md bg-background">
        <div className="flex items-center mb-2">
          <Book className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">API文档</h3>
        </div>
        <Separator className="my-3" />
        <p>该服务器没有提供API文档。</p>
        {server.homepage && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <a href={server.homepage} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              访问服务器主页
            </a>
          </Button>
        )}
      </div>
    );
  }
  
  // 嵌入式文档查看器
  const ApiDocsIframe = () => (
    <div className="border rounded-md overflow-hidden h-[500px]" style={{ height: showFullDocs ? '80vh' : '500px' }}>
      <iframe 
        src={`/api/docs/${server.id}`} 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none' 
        }}
        title={`${server.name} API文档`}
      />
    </div>
  );
  
  // 文档使用指南
  const ApiDocsGuide = () => (
    <div className="p-4 border rounded-md bg-background">
      <h3 className="text-lg font-semibold mb-4">使用说明</h3>
      <p className="mb-3">
        此API文档展示了服务器的所有可用API端点、参数和返回值。您可以使用这些API与服务器进行交互。
      </p>
      <p className="mb-3">
        要直接调用这些API，您需要：
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li className="mb-2">安装并运行该服务器</li>
        <li className="mb-2">使用适当的API客户端或代码向服务器发送请求</li>
        <li className="mb-2">按照文档中指定的格式构造请求参数</li>
      </ol>
      <p className="font-bold mb-2">
        示例代码可能包含在文档中，或者您可以查看服务器的示例代码部分。
      </p>
    </div>
  );
  
  // 如果是显示完整文档模式
  if (showFullDocs) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{server.name} API文档</h2>
          <Button
            asChild
            variant="default"
          >
            <a href={`/api/docs/${server.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              在新窗口中打开
            </a>
          </Button>
        </div>
        <ApiDocsIframe />
      </div>
    );
  }
  
  // 默认视图（带标签页）
  return (
    <div className="p-4 border rounded-md bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Code className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">API文档</h3>
        </div>
        <NextLink href={`/servers/${server.id}/docs`} passHref>
          <Button
            variant="outline"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            查看完整文档
          </Button>
        </NextLink>
      </div>
      
      <Tabs defaultValue="preview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">文档预览</TabsTrigger>
          <TabsTrigger value="guide">使用说明</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="pt-4">
          <ApiDocsIframe />
        </TabsContent>
        <TabsContent value="guide">
          <ApiDocsGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServerApiDocs; 