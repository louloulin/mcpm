import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { 
  CircleIcon, 
  PlusIcon, 
  UploadIcon, 
  BookIcon, 
  SettingsIcon 
} from 'lucide-react';

export const metadata: Metadata = {
  title: '控制面板 | MCPR',
  description: '管理您的MCP服务器和账户设置',
};

export default function DashboardPage() {
  // 模拟数据 - 实际项目中从API获取
  const publishedServers = [];
  const isLoggedIn = false; // 模拟未登录状态
  
  // 如果用户未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            请登录或注册，以访问您的控制面板、发布和管理MCP服务器。
          </p>
          <div className="flex gap-4">
            <Link href="/login">
              <Button size="lg">登录</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">注册</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">控制面板</h1>
          <p className="text-muted-foreground">
            管理您的MCP服务器、查看统计信息和更改账户设置
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground">
              <CircleIcon size={16} />
              概览
            </Link>
            <Link href="/dashboard/servers" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent">
              <CircleIcon size={16} />
              我的服务器
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent">
              <SettingsIcon size={16} />
              账户设置
            </Link>
            <Link href="/docs/publishing" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent">
              <BookIcon size={16} />
              发布指南
            </Link>
          </nav>
        </div>
        
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">已发布的服务器</h2>
            
            {publishedServers.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <UploadIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">您还没有发布任何服务器</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  开始创建并发布您的第一个MCP服务器，助力AI应用能力拓展
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard/servers/new">
                    <Button className="gap-1">
                      <PlusIcon size={16} />
                      创建服务器
                    </Button>
                  </Link>
                  <Link href="/docs/publishing">
                    <Button variant="outline" className="gap-1">
                      <BookIcon size={16} />
                      查看指南
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 这里会渲染已发布的服务器列表 */}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-semibold mb-2">下载统计</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">总下载量</p>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="font-semibold mb-2">收藏统计</h3>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">收藏次数</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 