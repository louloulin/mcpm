import { Metadata } from 'next';
import { SearchInput } from '../../components/search-input';
import ServerCard from '../../components/server-card';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export const metadata: Metadata = {
  title: '浏览MCP服务器 | MCPR',
  description: '发现和浏览各种优秀的MCP服务器，满足不同的应用场景需求',
};

// 模拟后端数据
const mockTags = ['数据库', 'AI', '文件系统', 'API', '工具', '自然语言处理', '搜索'];

// 获取服务器数据
async function getServers() {
  // 在实际项目中，这里会从API获取数据
  try {
    const res = await fetch('/servers.json');
    if (!res.ok) {
      throw new Error('Failed to fetch servers');
    }
    return res.json();
  } catch (error) {
    console.error('Error loading servers:', error);
    return [];
  }
}

export default async function BrowsePage() {
  const servers = await getServers();

  return (
    <div className="container py-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">浏览服务器</h1>
          <p className="text-muted-foreground">
            发现并使用各种优秀的MCP服务器，扩展AI应用能力
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mt-8">
        <aside className="md:w-1/4 lg:w-1/5">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">分类</h3>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="所有分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  <SelectItem value="database">数据库</SelectItem>
                  <SelectItem value="filesystem">文件系统</SelectItem>
                  <SelectItem value="api">API集成</SelectItem>
                  <SelectItem value="ai">AI工具</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">按标签过滤</h3>
              <div className="flex flex-wrap gap-2">
                {mockTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">排序方式</h3>
              <Select defaultValue="popular">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="按流行度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">按流行度</SelectItem>
                  <SelectItem value="newest">最新添加</SelectItem>
                  <SelectItem value="name">按名称</SelectItem>
                  <SelectItem value="rating">按评分</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>
        
        <main className="flex-1">
          <div className="mb-6">
            <SearchInput placeholder="搜索服务器..." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <ServerCard key={server.key} server={server} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
} 