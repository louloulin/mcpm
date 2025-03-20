"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import ServerCard from "@/components/ServerCard"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

// 这个接口只是为了接收来自父组件的属性
interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  email: string;
  bio: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  createdAt: string;
  skills: string[];
}

interface Server {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  downloads: number;
  rating?: number;
  createdAt: string;
  tags: string[];
}

interface Download {
  id: string;
  name: string;
  version: string;
  description: string;
  downloadedAt: string;
}

// 模拟数据
const USER_SERVERS: Server[] = [
  {
    id: 'server1',
    name: '基础MCP服务器',
    description: '简单易用的MCP协议服务器，支持核心功能',
    version: '1.2.0',
    author: {
      id: 'user1',
      name: '张三',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    downloads: 1280,
    rating: 4.5,
    createdAt: '2023-04-15T00:00:00Z',
    tags: ['基础', '稳定', '入门'],
  },
  {
    id: 'server2',
    name: '高级MCP调试服务器',
    description: '专为开发者设计的调试服务器，包含丰富的监控工具',
    version: '2.0.1',
    author: {
      id: 'user1',
      name: '张三',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    downloads: 870,
    rating: 4.8,
    createdAt: '2023-08-22T00:00:00Z',
    tags: ['调试', '开发工具', '高级'],
  },
];

// 模拟下载数据
const USER_DOWNLOADS: Download[] = [
  {
    id: 'download1',
    name: 'MCP高性能服务器',
    version: '3.1.2',
    description: '高性能、低延迟的MCP服务器实现',
    downloadedAt: '2023-11-05T00:00:00Z',
  },
  {
    id: 'download2',
    name: 'MCP安全增强服务器',
    version: '1.5.0',
    description: '增强的安全特性，适用于生产环境',
    downloadedAt: '2023-10-18T00:00:00Z',
  },
  {
    id: 'download3',
    name: '轻量级MCP服务器',
    version: '2.0.0',
    description: '适用于资源受限环境的轻量级实现',
    downloadedAt: '2023-09-30T00:00:00Z',
  },
];

interface ProfileTabsProps {
  user?: UserProfile;  // 将user参数设为可选
}

export default function ProfileTabs({}: ProfileTabsProps) {  // 使用空解构
  // 判断是否为当前用户（在实际应用中应通过身份验证来确定）
  const isCurrentUser = true;
  
  // 是否显示"创建服务器"按钮
  const showCreateButton = isCurrentUser && USER_SERVERS.length < 5;
  
  return (
    <Tabs defaultValue="servers" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="servers">我的服务器</TabsTrigger>
        <TabsTrigger value="downloads">下载记录</TabsTrigger>
      </TabsList>
      
      <TabsContent value="servers" className="mt-6">
        {USER_SERVERS.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/40">
            <h3 className="text-lg font-medium mb-2">还没有服务器</h3>
            <p className="text-muted-foreground mb-4">
              {isCurrentUser 
                ? '创建并分享您的第一个MCP服务器' 
                : '该用户尚未发布任何服务器'}
            </p>
            
            {isCurrentUser && (
              <Link href="/upload">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  创建服务器
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {USER_SERVERS.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
              
              {showCreateButton && (
                <Link href="/upload" className="block">
                  <div className="border-2 border-dashed rounded-lg h-full flex flex-col items-center justify-center p-6 hover:bg-muted/40 transition-colors">
                    <PlusCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">创建新服务器</h3>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      上传并分享您的MCP服务器
                    </p>
                  </div>
                </Link>
              )}
            </div>
            
            {isCurrentUser && USER_SERVERS.length >= 5 && (
              <div className="mt-4 flex justify-center">
                <Link href="/dashboard/servers">
                  <Button variant="outline">管理所有服务器</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="downloads" className="mt-6">
        {USER_DOWNLOADS.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/40">
            <h3 className="text-lg font-medium mb-2">还没有下载记录</h3>
            <p className="text-muted-foreground mb-4">
              {isCurrentUser 
                ? '浏览并下载感兴趣的服务器' 
                : '该用户尚未下载任何服务器'}
            </p>
            
            {isCurrentUser && (
              <Link href="/browse">
                <Button>
                  浏览服务器
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {USER_DOWNLOADS.map((download) => (
              <div key={download.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <Link href={`/servers/${download.id}`} className="font-medium hover:underline">
                    {download.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{download.description}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  下载于 {new Date(download.downloadedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
} 