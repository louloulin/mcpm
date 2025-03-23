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
  RefreshCw,
  Plus
} from 'lucide-react';

export default function ServersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;
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
  }, [user, currentPage, limit]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServers();
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 如果认证正在加载，显示加载状态
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-12 h-12 border-4 rounded-full border-primary/30 border-t-primary animate-spin mb-4"></div>
        <h2 className="text-lg font-medium text-muted-foreground">加载中...</h2>
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
          <h1 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
            我的服务器
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理您发布的所有MCP服务器
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            发布新服务器
          </Link>
        </div>
      </div>

      {/* 面包屑 */}
      <div className="mb-5 flex justify-between items-center">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                首页
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium text-foreground">我的服务器</span>
            </li>
          </ol>
        </nav>
        <Link
          href="/dashboard/servers/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加服务器
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        ) : servers.length > 0 ? (
          <>
            <ul className="divide-y divide-border">
              {servers.map((server) => (
                <li key={server.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                          <ServerIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-foreground">{server.name}</h3>
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-foreground text-primary"
                            >
                              v{server.version || '1.0.0'}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <span className="truncate">{server.description}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/servers/${server.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-input shadow-sm text-xs font-medium rounded text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看
                        </Link>
                        <Link
                          href={`/dashboard/servers/${server.id}/edit`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-input shadow-sm text-xs font-medium rounded text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          编辑
                        </Link>
                        <button
                          className="inline-flex items-center px-2.5 py-1.5 border border-destructive shadow-sm text-xs font-medium rounded text-destructive bg-background hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
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
                        <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                          <Download className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                          {formatNumber(server.downloads)} 次下载
                        </div>
                        <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0 sm:ml-6">
                          <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" />
                          {server.tags && server.tags.length > 0 
                            ? server.tags.join(', ') 
                            : '无标签'
                          }
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                        <span>更新于 {formatDate(server.updatedAt || server.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">上一页</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {/* 页码按钮 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'z-10 bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-input hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">下一页</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-background border border-border rounded-lg">
            <ServerIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">您还没有创建服务器</h3>
            <p className="text-sm text-muted-foreground mb-4">
              创建您的第一个服务器，开始管理您的内容
            </p>
            <Link
              href="/dashboard/servers/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              创建新服务器
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 