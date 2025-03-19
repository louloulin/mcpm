import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  ExternalLinkIcon,
  Download,
  Terminal,
  StarIcon,
  Git,
  ArrowLeft
} from 'lucide-react';
import { formatDate, formatNumber } from '../../../lib/utils';

interface PageProps {
  params: {
    key: string;
  };
}

// 获取服务器详情数据
async function getServerDetails(key: string) {
  try {
    // 在实际项目中，这里会从API获取数据
    const res = await fetch('/servers.json');
    if (!res.ok) {
      throw new Error('Failed to fetch servers');
    }
    const servers = await res.json();
    return servers.find((server: any) => server.key === key);
  } catch (error) {
    console.error('Error loading server details:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const server = await getServerDetails(params.key);
  
  if (!server) {
    return {
      title: '服务器未找到 | MCPR',
      description: '无法找到请求的MCP服务器',
    };
  }
  
  return {
    title: `${server.name || server.key} | MCPR`,
    description: server.description || `${server.name || server.key} - MCP服务器详情`,
  };
}

export default async function ServerPage({ params }: PageProps) {
  const server = await getServerDetails(params.key);
  
  if (!server) {
    notFound();
  }
  
  const { key, name, description, command, args = [], env = {}, homepage, tags = [] } = server;
  const displayName = name || key;

  return (
    <div className="container py-8">
      <Link href="/browse" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} className="mr-1" />
        返回浏览
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
              <p className="text-muted-foreground mt-1">{description || '暂无描述'}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {homepage && (
                <a 
                  href={homepage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLinkIcon size={18} />
                  <span>项目主页</span>
                </a>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">安装说明</h2>
              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={18} />
                    <span className="font-mono">mcpr install {key}</span>
                  </div>
                  <Button size="sm" variant="secondary">复制</Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                安装后使用 <code className="bg-muted px-1 py-0.5 rounded">mcpr info {key}</code> 查看详细信息
              </p>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">服务器详情</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-md p-4">
                  <dt className="text-sm font-medium text-muted-foreground">命令</dt>
                  <dd className="font-mono mt-1">{command || 'N/A'}</dd>
                </div>
                
                <div className="bg-muted/50 rounded-md p-4">
                  <dt className="text-sm font-medium text-muted-foreground">参数</dt>
                  <dd className="font-mono mt-1 break-all">
                    {args.length > 0 ? args.join(' ') : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
            
            {Object.keys(env).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">环境变量</h2>
                <div className="bg-muted/50 rounded-md p-4">
                  <ul className="space-y-2">
                    {Object.entries(env).map(([key, value]) => (
                      <li key={key} className="flex items-start">
                        <span className="font-mono text-primary">{key}</span>
                        <span className="mx-2">=</span>
                        <span className="font-mono">{value || '<需要配置>'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="flex flex-col space-y-4">
              <Button className="w-full gap-2">
                <Download size={16} />
                安装服务器
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
                <StarIcon size={16} />
                添加到收藏
              </Button>
              
              {homepage && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={homepage} target="_blank" rel="noopener noreferrer">
                    <Git size={16} />
                    查看源码
                  </a>
                </Button>
              )}
            </div>
            
            <div className="border-t mt-6 pt-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">下载量</dt>
                  <dd className="text-sm font-medium">{formatNumber(server.downloads || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">最近更新</dt>
                  <dd className="text-sm font-medium">{server.updatedAt ? formatDate(server.updatedAt) : '未知'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">版本</dt>
                  <dd className="text-sm font-medium">{server.version || '未知'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">许可证</dt>
                  <dd className="text-sm font-medium">{server.license || '未指定'}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold mb-4">相关服务器</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">暂无相关服务器推荐</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 