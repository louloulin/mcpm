import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  PuzzleIcon,
  CodeIcon,
  ArrowRightIcon,
  DatabaseIcon,
  CloudIcon,
  AlertCircleIcon,
  LineChartIcon,
  SettingsIcon,
  FileTextIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '插件系统 | MCPM',
  description: '探索MCPM的插件生态系统，扩展MCP服务器功能',
};

interface PluginCardProps {
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  popular?: boolean;
  new?: boolean;
}

function PluginCard({ name, description, category, icon, popular, new: isNew }: PluginCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{name}</CardTitle>
          </div>
          <div className="flex gap-2">
            {popular && <Badge variant="secondary">热门</Badge>}
            {isNew && <Badge variant="default">新增</Badge>}
          </div>
        </div>
        <CardDescription>{category}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <Button variant="outline" className="w-full">了解更多</Button>
      </div>
    </Card>
  );
}

export default function PluginsPage() {
  const featuredPlugins: PluginCardProps[] = [
    {
      name: '数据库连接器',
      description: '连接到SQL、NoSQL和向量数据库，支持PostgreSQL、MongoDB、Redis等',
      category: '数据处理',
      icon: <DatabaseIcon className="h-5 w-5 text-primary" />,
      popular: true,
    },
    {
      name: '云存储集成',
      description: '与AWS S3、Azure Blob、Google Cloud Storage等云存储服务集成',
      category: '存储',
      icon: <CloudIcon className="h-5 w-5 text-primary" />,
      popular: true,
    },
    {
      name: '高级安全监控',
      description: '提供实时安全监控、威胁检测和访问控制功能',
      category: '安全',
      icon: <AlertCircleIcon className="h-5 w-5 text-primary" />,
      new: true,
    },
    {
      name: '分析与指标',
      description: '收集使用数据，生成可视化报告和性能指标',
      category: '监控',
      icon: <LineChartIcon className="h-5 w-5 text-primary" />,
    },
    {
      name: '环境配置管理',
      description: '管理不同环境的配置，支持加密敏感信息',
      category: '配置',
      icon: <SettingsIcon className="h-5 w-5 text-primary" />,
    },
    {
      name: '文档自动生成',
      description: '根据MCP工具定义自动生成API文档和示例',
      category: '工具',
      icon: <FileTextIcon className="h-5 w-5 text-primary" />,
      new: true,
    },
  ];

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">插件系统</h1>
          <p className="text-xl text-muted-foreground">
            通过插件扩展MCPM服务器功能，满足多样化需求
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {featuredPlugins.map((plugin, index) => (
            <PluginCard key={index} {...plugin} />
          ))}
        </div>

        <div className="mt-12 bg-muted p-8 rounded-lg">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-2/3 space-y-4">
              <h2 className="text-2xl font-bold">开发自己的插件</h2>
              <p className="text-muted-foreground">
                使用我们的插件开发工具包，快速构建和发布您自己的MCPM插件。我们提供了完整的API文档和开发指南，帮助您轻松扩展平台功能。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="gap-2">
                  <CodeIcon className="h-4 w-4" />
                  查看开发指南
                </Button>
                <Button variant="outline" className="gap-2">
                  <PuzzleIcon className="h-4 w-4" />
                  探索API文档
                </Button>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PuzzleIcon className="h-24 w-24 text-primary opacity-50" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CodeIcon className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">插件类别</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/enterprise/plugins/data" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>数据处理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    数据存储、查询和转换插件
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">12个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/enterprise/plugins/integration" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>集成</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    外部服务和API集成插件
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">18个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/enterprise/plugins/security" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>安全</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    认证、加密和访问控制插件
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">8个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/enterprise/plugins/monitoring" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>监控</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    日志、指标和警报插件
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">10个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/enterprise/plugins/tools" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>工具与实用程序</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    开发和调试辅助工具
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">15个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/enterprise/plugins/all" className="block">
              <Card className="h-full hover:shadow-md transition-shadow bg-primary/5">
                <CardHeader>
                  <CardTitle>所有插件</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    浏览完整的插件目录
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">63个插件</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="mt-12 border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">插件兼容性</h2>
          <p className="text-muted-foreground mb-6">
            我们的插件兼容多种环境和平台，确保您的MCP服务器无论在何处运行都能获得扩展功能。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">运行时环境</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Node.js (v14+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Python (3.8+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Deno</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Docker容器</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">部署平台</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>自托管服务器</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>AWS Lambda</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Vercel</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Cloudflare Workers</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">MCP客户端</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Claude</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>GPT</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>Gemini</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                  <span>通用MCP客户端</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">开始使用插件</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-6">
            通过插件扩展您的MCP服务器功能，提升应用能力和用户体验。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <PuzzleIcon className="h-4 w-4" />
              浏览插件目录
            </Button>
            <Link href="/enterprise/plugins/featured">
              <Button variant="outline" size="lg">
                推荐插件
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 