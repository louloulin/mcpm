"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

export default function UIDemo() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">UI 组件示例</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">按钮</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">默认按钮</Button>
            <Button variant="destructive">删除按钮</Button>
            <Button variant="outline">轮廓按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button variant="link">链接按钮</Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">输入框</h2>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">电子邮箱</Label>
              <Input type="email" id="email" placeholder="example@example.com" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="password">密码</Label>
              <Input type="password" id="password" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">卡片</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>账户设置</CardTitle>
              <CardDescription>管理您的账户信息和偏好设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">通知</Label>
                  <Switch id="notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing">营销邮件</Label>
                  <Switch id="marketing" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>保存更改</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>服务器信息</CardTitle>
              <CardDescription>服务器基本信息与状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">状态</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">在线</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">版本</span>
                  <span>1.2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">下载量</span>
                  <span>1,234</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">查看详情</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>发送反馈</CardTitle>
              <CardDescription>告诉我们您的使用体验</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="feedback">您的反馈</Label>
                  <Textarea id="feedback" placeholder="请输入您的反馈..." />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>提交</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">标签页</h2>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">账户</TabsTrigger>
            <TabsTrigger value="password">密码</TabsTrigger>
            <TabsTrigger value="notification">通知</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="p-4 border rounded-md mt-2">
            <h3 className="text-lg font-medium">账户设置</h3>
            <p className="text-sm text-muted-foreground mt-1">修改您的账户设置和个人信息。</p>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">姓名</Label>
                <Input id="name" defaultValue="王小明" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">用户名</Label>
                <Input id="username" defaultValue="wangxiaoming" className="col-span-3" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="password" className="p-4 border rounded-md mt-2">
            <h3 className="text-lg font-medium">修改密码</h3>
            <p className="text-sm text-muted-foreground mt-1">确保您的账户安全，定期更换密码。</p>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current" className="text-right">当前密码</Label>
                <Input id="current" type="password" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new" className="text-right">新密码</Label>
                <Input id="new" type="password" className="col-span-3" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="notification" className="p-4 border rounded-md mt-2">
            <h3 className="text-lg font-medium">通知设置</h3>
            <p className="text-sm text-muted-foreground mt-1">配置您想接收的通知类型。</p>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notif">电子邮件通知</Label>
                  <p className="text-sm text-muted-foreground">接收有关账户活动的电子邮件</p>
                </div>
                <Switch id="email-notif" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-notif">营销通知</Label>
                  <p className="text-sm text-muted-foreground">接收有关新功能和优惠的通知</p>
                </div>
                <Switch id="marketing-notif" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">主题切换</h2>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">点击切换浅色/深色模式</span>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">头像</h2>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/300?img=1" alt="用户头像" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="text-sm">带图像</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarFallback>WX</AvatarFallback>
            </Avatar>
            <span className="text-sm">文字备选</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">图标备选</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-14 w-14">
              <AvatarImage src="https://i.pravatar.cc/300?img=2" alt="大尺寸头像" />
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <span className="text-sm">大尺寸</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://i.pravatar.cc/300?img=3" alt="小尺寸头像" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <span className="text-sm">小尺寸</span>
          </div>
        </div>
      </div>
    </div>
  )
} 