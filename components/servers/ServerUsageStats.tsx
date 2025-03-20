"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UsageDataPoint {
  date: string
  requests: number
  tokens: number
  users: number
}

interface ServerUsageStatsProps {
  timeframe?: "day" | "week" | "month" | "year"
  data: {
    daily: UsageDataPoint[]
    weekly: UsageDataPoint[]
    monthly: UsageDataPoint[]
  }
}

export default function ServerUsageStats({ 
  timeframe = "month", 
  data 
}: ServerUsageStatsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>使用统计</CardTitle>
        <CardDescription>
          查看此服务器的使用情况和请求统计
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="requests" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="requests">API请求</TabsTrigger>
              <TabsTrigger value="tokens">Token用量</TabsTrigger>
              <TabsTrigger value="users">用户数</TabsTrigger>
            </TabsList>
            
            <div className="flex">
              <select 
                className="bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                defaultValue={timeframe}
              >
                <option value="day">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">今年</option>
              </select>
            </div>
          </div>
          
          <TabsContent value="requests" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.monthly} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`${value} 请求`, `请求数`]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Bar 
                    dataKey="requests" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatsCard
                title="总请求数"
                value={data.monthly.reduce((acc, curr) => acc + curr.requests, 0).toLocaleString()}
                change={"+12.5%"}
                isPositive={true}
              />
              
              <StatsCard
                title="平均每日请求"
                value={(data.monthly.reduce((acc, curr) => acc + curr.requests, 0) / data.monthly.length).toFixed(0).toLocaleString()}
                change={"+5.2%"}
                isPositive={true}
              />
              
              <StatsCard
                title="最高请求日"
                value={Math.max(...data.monthly.map(d => d.requests)).toLocaleString()}
                date={data.monthly.reduce((max, curr) => curr.requests > max.requests ? curr : max, data.monthly[0]).date}
              />
              
              <StatsCard
                title="失败率"
                value="0.8%"
                change={"-0.2%"}
                isPositive={true}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="tokens" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.monthly} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} tokens`, `Token用量`]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Bar 
                    dataKey="tokens" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatsCard
                title="总Token用量"
                value={data.monthly.reduce((acc, curr) => acc + curr.tokens, 0).toLocaleString()}
                change={"+18.3%"}
                isPositive={false}
              />
              
              <StatsCard
                title="平均每日用量"
                value={(data.monthly.reduce((acc, curr) => acc + curr.tokens, 0) / data.monthly.length).toFixed(0).toLocaleString()}
                change={"+7.1%"}
                isPositive={false}
              />
              
              <StatsCard
                title="预计月度费用"
                value="¥285.50"
                change={"+12.8%"}
                isPositive={false}
              />
              
              <StatsCard
                title="每次请求平均"
                value={(data.monthly.reduce((acc, curr) => acc + curr.tokens, 0) / data.monthly.reduce((acc, curr) => acc + curr.requests, 0)).toFixed(0).toLocaleString()}
                change={"+0.5%"}
                isPositive={false}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.monthly} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`${value} 用户`, `活跃用户数`]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Bar 
                    dataKey="users" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatsCard
                title="总用户数"
                value={Math.max(...data.monthly.map(d => d.users)).toLocaleString()}
                change={"+22.5%"}
                isPositive={true}
              />
              
              <StatsCard
                title="日均活跃用户"
                value={(data.monthly.reduce((acc, curr) => acc + curr.users, 0) / data.monthly.length).toFixed(0).toLocaleString()}
                change={"+15.2%"}
                isPositive={true}
              />
              
              <StatsCard
                title="用户增长率"
                value="8.3%"
                change={"+1.2%"}
                isPositive={true}
              />
              
              <StatsCard
                title="人均请求数"
                value={(data.monthly.reduce((acc, curr) => acc + curr.requests, 0) / Math.max(...data.monthly.map(d => d.users))).toFixed(1).toLocaleString()}
                change={"-0.8%"}
                isPositive={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface StatsCardProps {
  title: string
  value: string
  change?: string
  isPositive?: boolean
  date?: string
}

function StatsCard({ title, value, change, isPositive, date }: StatsCardProps) {
  return (
    <div className="rounded-lg border p-3 bg-card">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {change && (
        <p className={`text-xs flex items-center mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '↑' : '↓'} {change}
        </p>
      )}
      {date && (
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  )
} 