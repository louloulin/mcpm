import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { 
  CircleIcon, 
  BookIcon,
  SettingsIcon,
  PlusIcon,
  InfoIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '发布新服务器 | MCPR',
  description: '创建并发布新的MCP服务器到仓库',
};

export default function NewServerPage() {
  // 模拟数据 - 实际项目中从API获取
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
          <h1 className="text-3xl font-bold tracking-tight">发布新服务器</h1>
          <p className="text-muted-foreground">
            创建并发布新的MCP服务器到仓库，使其他用户能够发现和使用您的服务
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent">
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
        
        <div className="md:col-span-3">
          <div className="space-y-6">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">基本信息</h2>
              <form className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">服务器名称</Label>
                      <Input id="name" placeholder="给您的服务器起一个描述性的名称" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key">唯一标识符</Label>
                      <Input id="key" placeholder="my-server" />
                      <p className="text-xs text-muted-foreground">字母、数字和连字符，将用于安装命令</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea 
                      id="description" 
                      placeholder="详细描述您的服务器功能和用途" 
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">版本</Label>
                      <Input id="version" placeholder="1.0.0" />
                      <p className="text-xs text-muted-foreground">遵循语义化版本规范</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">许可证</Label>
                      <Input id="license" placeholder="MIT" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="homepage">主页</Label>
                      <Input id="homepage" placeholder="https://example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repository">代码仓库</Label>
                      <Input id="repository" placeholder="https://github.com/user/repo" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">标签</Label>
                    <Input id="tags" placeholder="以逗号分隔，如: ai, tools, data" />
                    <p className="text-xs text-muted-foreground">添加相关标签以帮助用户发现您的服务器</p>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">运行配置</h2>
              <form className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="command">启动命令</Label>
                    <Input id="command" placeholder="node server.js" />
                    <p className="text-xs text-muted-foreground">用于启动服务器的命令</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="args">命令参数</Label>
                    <Input id="args" placeholder="--port 3000 --verbose" />
                    <p className="text-xs text-muted-foreground">可选的命令行参数</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      环境变量
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Label>
                    <div className="border rounded-md p-4 space-y-2">
                      <div className="flex gap-2">
                        <Input placeholder="变量名" className="flex-1" />
                        <Input placeholder="值" className="flex-1" />
                        <Button variant="outline" type="button" size="icon" className="shrink-0">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">添加服务器运行所需的环境变量</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      系统要求
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="node-version">Node.js 版本</Label>
                        <Input id="node-version" placeholder=">=16.0.0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="memory">内存要求</Label>
                        <Input id="memory" placeholder="512MB" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">MCP 工具定义</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    定义您的服务器提供的MCP工具及其参数
                  </p>
                  <Button size="sm" className="gap-1">
                    <PlusIcon size={16} />
                    添加工具
                  </Button>
                </div>
                
                <div className="border rounded-md p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tool-name">工具名称</Label>
                    <Input id="tool-name" placeholder="search_database" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tool-description">工具描述</Label>
                    <Textarea 
                      id="tool-description" 
                      placeholder="在数据库中搜索信息" 
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">参数</Label>
                    <div className="border rounded-md p-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input placeholder="参数名" className="md:col-span-1" />
                        <Input placeholder="类型" className="md:col-span-1" />
                        <Input placeholder="描述" className="md:col-span-1" />
                        <div className="flex items-center gap-2 md:col-span-1">
                          <Label htmlFor="required" className="text-sm">必需</Label>
                          <Input type="checkbox" id="required" className="h-4 w-4" />
                          <Button variant="outline" type="button" size="icon" className="ml-auto">
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center p-8 border border-dashed rounded-md">
                  <p className="text-muted-foreground text-sm">点击"添加工具"按钮创建更多工具</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button variant="outline">保存为草稿</Button>
              <Button className="gap-1">
                <PlusIcon size={16} />
                发布服务器
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}