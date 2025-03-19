import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  CircleIcon, 
  BookIcon,
  SettingsIcon 
} from 'lucide-react';

export const metadata: Metadata = {
  title: '账户设置 | MCPR',
  description: '管理您的账户设置和偏好',
};

export default function DashboardSettingsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">账户设置</h1>
          <p className="text-muted-foreground">
            管理您的个人信息、安全选项和通知偏好
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
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground">
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
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">个人资料</TabsTrigger>
                <TabsTrigger value="security">安全</TabsTrigger>
                <TabsTrigger value="notifications">通知</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">个人资料</h3>
                  <p className="text-sm text-muted-foreground">
                    更新您的个人资料信息，这些信息将显示在您的公开页面上。
                  </p>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        用户名
                      </Label>
                      <Input
                        id="name"
                        defaultValue="用户名"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        电子邮箱
                      </Label>
                      <Input
                        id="email"
                        defaultValue="user@example.com"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bio" className="text-right">
                        个人简介
                      </Label>
                      <textarea
                        id="bio"
                        className="col-span-3 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="请输入您的个人简介"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>保存更改</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">修改密码</h3>
                  <p className="text-sm text-muted-foreground">
                    更新您的登录密码，建议定期更改密码以保障账户安全。
                  </p>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        当前密码
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        新密码
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-password" className="text-right">
                        确认新密码
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>更新密码</Button>
                  </div>
                </div>
                
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium">双因素认证</h3>
                  <p className="text-sm text-muted-foreground">
                    启用双因素认证以增强账户安全性。
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">
                        双因素认证
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        使用应用程序验证码保护您的账户
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">通知设置</h3>
                  <p className="text-sm text-muted-foreground">
                    配置接收哪些类型的通知以及通知方式。
                  </p>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">
                          服务器下载通知
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          当有人下载您的服务器时通知您
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">
                          评论通知
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          当有人评论您的服务器时通知您
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">
                          更新通知
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          接收平台更新和新功能公告
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">
                          营销邮件
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          接收产品推广和营销相关的邮件
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>保存偏好</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 