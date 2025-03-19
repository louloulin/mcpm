'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient, Server } from '../../../lib/api-client';
import { formatDate, formatNumber } from '../../../lib/utils';
import { 
  PlusCircle, 
  Server as ServerIcon, 
  Download,
  Tag,
  MoreHorizontal,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function ServersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 如果用户未登录且认证加载完成，重定向到登录页
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/servers');
    }
  }, [user, authLoading, router]);

  const fetchServers = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 获取用户发布的服务器
      const result = await apiClient.getAllServers({ 
        page,
        limit,
        // 此处假设API支持按作者ID过滤
        // author_id: user.id 
      });
      
      setServers(result.items);
      setTotalPages(Math.ceil(result.total / limit));
    } catch (err) {
      console.error('获取服务器列表失败:', err);
      setError('加载数据失败，请稍后再试');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [user, page, limit]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServers();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // 如果认证正在加载，显示加载状态
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果用户未登录，显示空页面（会被重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            我的服务器
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您发布的所有MCP服务器
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新
          </button>
          <Link
            href="/dashboard/servers/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            发布新服务器
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : servers.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-200">
              {servers.map((server) => (
                <li key={server.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                          <ServerIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{server.name}</h3>
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              v{server.version}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate">{server.description}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/servers/${server.key}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看
                        </Link>
                        <Link
                          href={`/dashboard/servers/${server.key}/edit`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          编辑
                        </Link>
                        <button
                          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={() => {
                            if (window.confirm(`确定要删除服务器 "${server.name}" 吗？此操作不可撤销。`)) {
                              // TODO: 实现删除逻辑
                              alert('删除功能尚未实现');
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Download className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {formatNumber(server.downloads)} 次下载
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {server.tags && server.tags.length > 0 
                            ? server.tags.join(', ') 
                            : '无标签'
                          }
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span>更新于 {formatDate(server.updatedAt || server.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一页
                  </button>
                  <div className="hidden md:flex">
                    <span className="text-sm text-gray-700">
                      第 <span className="font-medium">{page}</span> 页，
                      共 <span className="font-medium">{totalPages}</span> 页
                    </span>
                  </div>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无服务器</h3>
            <p className="mt-1 text-sm text-gray-500">
              开始发布您的第一个MCP服务器吧
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/servers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                发布新服务器
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 