import { Suspense } from "react";
import { Metadata } from "next";
import { RecommendationsSection } from "./recommendations";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, DownloadIcon, UploadIcon, ServerIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "服务器管理仪表盘",
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="仪表盘" text="服务器管理和概览">
        <Button>
          <ServerIcon className="mr-2 h-4 w-4" /> 创建服务器
        </Button>
      </DashboardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              已部署服务器
            </CardTitle>
            <ServerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 在过去的一个月中
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总下载量</CardTitle>
            <DownloadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">
              +126 在过去的一个月中
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已上传版本</CardTitle>
            <UploadIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +8 在过去的一个月中
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              活跃服务器
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
            <p className="text-xs text-muted-foreground">
              +2 在过去的一周中
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>概览</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="analytics">用量分析</TabsTrigger>
                <TabsTrigger value="reports">报告</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <p>您的服务器运行状况良好。没有需要注意的问题。</p>
              </TabsContent>
              <TabsContent value="analytics">
                分析数据加载中...
              </TabsContent>
              <TabsContent value="reports">
                报告数据加载中...
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Suspense fallback={<div>加载推荐...</div>}>
          <RecommendationsSection />
        </Suspense>
      </div>
    </DashboardShell>
  );
} 