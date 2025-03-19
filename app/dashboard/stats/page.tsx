'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, DeveloperStats } from '@/lib/api-client';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Star,
  Server,
  LineChart,
  ArrowUpCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// 图表组件
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DeveloperStatsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果用户未登录且认证加载完成，重定向到登录页
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/stats');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.getDeveloperStats();
        setStats(data);
      } catch (err) {
        console.error('获取开发者统计数据失败:', err);
        setError('加载数据失败，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-gray-600">加载统计数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="mt-4 text-lg text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <AlertCircle className="w-10 h-10 text-yellow-500" />
        <p className="mt-4 text-lg text-gray-600">暂无统计数据</p>
        <Link
          href="/dashboard/servers/new"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <ArrowUpCircle className="w-4 h-4" />
          发布新服务器
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">开发者统计面板</h1>
      
      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Server className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold">服务器数量</h2>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats.totalServers)}</p>
          <p className="text-sm text-gray-500 mt-1">您已发布的服务器总数</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Download className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-semibold">总下载量</h2>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats.totalDownloads)}</p>
          <p className="text-sm text-gray-500 mt-1">所有服务器的累计下载次数</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold">平均评分</h2>
          </div>
          <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">所有服务器的平均用户评分</p>
        </div>
      </div>
      
      {/* 下载趋势图表 */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <LineChart className="h-6 w-6 text-purple-500" />
          <h2 className="text-lg font-semibold">30天下载趋势</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.downloadTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date: string) => {
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} 次下载`, '下载量']}
                labelFormatter={(date: string) => {
                  const d = new Date(date);
                  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 最受欢迎的服务器与最近发布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 最受欢迎的服务器 */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold">最受欢迎的服务器</h2>
          </div>
          
          {stats.mostPopularServer ? (
            <div>
              <h3 className="font-semibold text-lg">{stats.mostPopularServer.name}</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">下载量</p>
                  <p className="font-medium">{formatNumber(stats.mostPopularServer.downloads)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">评分</p>
                  <p className="font-medium">{Number(stats.mostPopularServer.rating).toFixed(1)}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/servers/${stats.mostPopularServer.key}`}
                  className="text-blue-500 hover:underline text-sm"
                >
                  查看详情
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">暂无数据</p>
          )}
        </div>
        
        {/* 最近发布的服务器 */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-6 w-6 text-teal-500" />
            <h2 className="text-lg font-semibold">最近发布的服务器</h2>
          </div>
          
          {stats.recentServers && stats.recentServers.length > 0 ? (
            <ul className="divide-y">
              {stats.recentServers.map((server) => (
                <li key={server.id} className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{server.name}</h3>
                      <p className="text-sm text-gray-500">
                        {server.createdAt 
                          ? `发布于 ${formatDate(new Date(server.createdAt))}` 
                          : '发布日期未知'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(server.downloads)}</p>
                      <p className="text-sm text-gray-500">下载</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/servers/${server.key}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      查看详情
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无数据</p>
          )}
        </div>
      </div>
      
      {/* 发布新服务器按钮 */}
      <div className="text-center mt-8">
        <Link
          href="/dashboard/servers/new"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors gap-2"
        >
          <ArrowUpCircle className="w-5 h-5" />
          发布新服务器
        </Link>
      </div>
    </div>
  );
} 