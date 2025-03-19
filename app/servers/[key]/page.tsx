'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Server } from '../../../lib/api-client';
import { formatDate, formatNumber } from '../../../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Download, 
  Star, 
  Clock, 
  User, 
  Globe, 
  Github, 
  Tag, 
  Package,
  FileText,
  Terminal,
  Settings,
  Users
} from 'lucide-react';

export default function ServerDetailPage({ params }: { params: { key: string } }) {
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.getServerById(params.key);
        setServer(data);
      } catch (err) {
        console.error('获取服务器详情失败:', err);
        setError('无法加载服务器详情，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServer();
  }, [params.key]);

  // 处理下载按钮点击
  const handleDownload = () => {
    if (!server) return;
    
    // 模拟复制命令到剪贴板
    const command = `npm install @mcp/${server.key}`;
    navigator.clipboard.writeText(command)
      .then(() => {
        alert('安装命令已复制到剪贴板');
      })
      .catch((err) => {
        console.error('复制失败:', err);
      });
  };
  
  // 加载中状态
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (error || !server) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || '无法加载服务器信息'}
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="mt-4 text-sm font-medium text-red-700 hover:text-red-600"
              >
                返回浏览页面
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{server.name}</h1>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                v{server.version}
              </span>
            </div>
            <p className="mt-2 text-xl text-gray-500">{server.description}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="mr-2 h-5 w-5" />
              安装服务器
            </button>
            
            <div className="text-center text-xs text-gray-500 mt-1">
              npm install @mcp/{server.key}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-3">
          <Download className="h-6 w-6 text-blue-500" />
          <div>
            <div className="text-2xl font-bold">{formatNumber(server.downloads)}</div>
            <div className="text-sm text-gray-500">总下载量</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-3">
          <Star className="h-6 w-6 text-amber-500" />
          <div>
            <div className="text-2xl font-bold">{server.rating.toFixed(1)}</div>
            <div className="text-sm text-gray-500">{server.reviewCount} 条评价</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-3">
          <Clock className="h-6 w-6 text-green-500" />
          <div>
            <div className="text-sm font-medium">发布于 {formatDate(server.createdAt)}</div>
            <div className="text-sm text-gray-500">更新于 {formatDate(server.updatedAt)}</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-3">
          <User className="h-6 w-6 text-purple-500" />
          <div>
            <div className="text-sm font-medium">
              {server.author?.username || '未知作者'}
            </div>
            <div className="text-sm text-gray-500">
              {server.author?.role === 'admin' ? '管理员' : '开发者'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="tools">功能与工具</TabsTrigger>
              <TabsTrigger value="versions">版本历史</TabsTrigger>
              <TabsTrigger value="usage">使用指南</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="bg-white p-6 rounded-lg border min-h-[300px]">
              <h2 className="text-xl font-bold mb-4">服务器概览</h2>
              <p className="text-gray-700 mb-4">
                {server.description}
              </p>
              
              {server.tags && server.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {server.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {server.requirements && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">系统要求</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {server.requirements.node && (
                      <div>
                        <span className="text-sm font-medium">Node版本:</span>
                        <span className="text-sm text-gray-700 ml-2">{server.requirements.node}</span>
                      </div>
                    )}
                    {server.requirements.memory && (
                      <div>
                        <span className="text-sm font-medium">内存要求:</span>
                        <span className="text-sm text-gray-700 ml-2">{server.requirements.memory}</span>
                      </div>
                    )}
                    {server.requirements.disk && (
                      <div>
                        <span className="text-sm font-medium">磁盘空间:</span>
                        <span className="text-sm text-gray-700 ml-2">{server.requirements.disk}</span>
                      </div>
                    )}
                    {server.requirements.cpu && (
                      <div>
                        <span className="text-sm font-medium">CPU要求:</span>
                        <span className="text-sm text-gray-700 ml-2">{server.requirements.cpu}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">许可证</h3>
                <p className="text-gray-700">{server.license}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="bg-white p-6 rounded-lg border min-h-[300px]">
              <h2 className="text-xl font-bold mb-4">功能与工具</h2>
              
              {server.tools && server.tools.length > 0 ? (
                <div className="space-y-6">
                  {server.tools.map(tool => (
                    <div key={tool.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-1">{tool.name}</h3>
                      <p className="text-gray-600 mb-2">{tool.description}</p>
                      <div className="text-xs text-gray-500">工具版本: v{tool.version}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">该服务器未公开任何工具信息</p>
              )}
            </TabsContent>
            
            <TabsContent value="versions" className="bg-white p-6 rounded-lg border min-h-[300px]">
              <h2 className="text-xl font-bold mb-4">版本历史</h2>
              
              {server.publishedVersions && server.publishedVersions.length > 0 ? (
                <div className="space-y-6">
                  {server.publishedVersions.map((ver, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between mb-2">
                        <h3 className="text-lg font-medium">v{ver.version}</h3>
                        <span className="text-sm text-gray-500">{formatDate(ver.publishedAt)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">
                        {ver.changelog || '未提供版本更新日志'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无版本历史记录</p>
              )}
            </TabsContent>
            
            <TabsContent value="usage" className="bg-white p-6 rounded-lg border min-h-[300px]">
              <h2 className="text-xl font-bold mb-4">使用指南</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">安装</h3>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <code className="text-sm">npm install @mcp/{server.key}</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">基本使用</h3>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <pre className="text-sm overflow-x-auto">
                      {`import { createServer } from '@mcp/${server.key}';

// 创建服务器实例
const server = createServer({
  // 配置选项
});

// 启动服务器
server.start();`}
                    </pre>
                  </div>
                </div>
                
                <p className="text-gray-700">
                  查看项目主页或参阅文档获取更详细的使用说明。
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-4">相关链接</h2>
            <ul className="space-y-3">
              {server.homepage && (
                <li>
                  <a 
                    href={server.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    项目主页
                  </a>
                </li>
              )}
              
              {server.repository && (
                <li>
                  <a 
                    href={server.repository} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    代码仓库
                  </a>
                </li>
              )}
              
              <li>
                <a 
                  href={`/docs/servers/${server.key}`}
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  查看文档
                </a>
              </li>
              
              <li>
                <a 
                  href="/docs/getting-started"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Package className="h-4 w-4 mr-2" />
                  快速入门
                </a>
              </li>
              
              <li>
                <a 
                  href="/docs/api/reference"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  API参考
                </a>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-4">其他信息</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">作者</h3>
                <div className="flex items-center mt-1">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {server.author?.avatarUrl ? (
                      <img 
                        src={server.author.avatarUrl} 
                        alt={server.author.username} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium">{server.author?.username || '未知作者'}</div>
                    {server.author?.email && (
                      <div className="text-xs text-gray-500">{server.author.email}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">管理</h3>
                <div className="flex flex-col mt-2 space-y-2">
                  <a 
                    href="#" 
                    className="flex items-center text-sm text-gray-700 hover:text-blue-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    报告问题
                  </a>
                  
                  <a 
                    href="#" 
                    className="flex items-center text-sm text-gray-700 hover:text-blue-600"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    查看贡献者
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 