import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BookOpenIcon,
  CodeIcon,
  CommandIcon,
  FileTextIcon,
  GlobeIcon,
  ServerIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '文档中心 | MCPR',
  description: 'MCP服务器仓库的使用指南、API文档和最佳实践',
};

interface DocCategoryProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  links: Array<{
    title: string;
    href: string;
    badge?: string;
  }>;
}

function DocCategory({ title, description, icon, links }: DocCategoryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index}>
              <Link 
                href={link.href}
                className="text-foreground hover:text-primary flex items-center justify-between"
              >
                <span>{link.title}</span>
                {link.badge && (
                  <Badge variant="outline">{link.badge}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function DocsPage() {
  const categories: DocCategoryProps[] = [
    {
      title: '入门指南',
      description: '开始使用MCP服务器仓库的基础知识',
      icon: <BookOpenIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '什么是MCP服务器?', href: '/docs/introduction' },
        { title: '快速上手', href: '/docs/getting-started' },
        { title: '安装CLI工具', href: '/docs/cli-installation' },
        { title: '常见问题解答', href: '/docs/faq' },
        { title: '术语表', href: '/docs/glossary' },
      ],
    },
    {
      title: '使用服务器',
      description: '如何发现、安装和使用MCP服务器',
      icon: <ServerIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '浏览和搜索服务器', href: '/docs/browsing' },
        { title: '安装服务器', href: '/docs/installation' },
        { title: '配置服务器', href: '/docs/configuration' },
        { title: '更新和卸载', href: '/docs/updates' },
        { title: '故障排除', href: '/docs/troubleshooting' },
      ],
    },
    {
      title: '发布指南',
      description: '将您的MCP服务器发布到仓库',
      icon: <GlobeIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '准备您的服务器', href: '/docs/publishing/preparation' },
        { title: '元数据规范', href: '/docs/publishing/metadata' },
        { title: '工具定义', href: '/docs/publishing/tools' },
        { title: '版本管理', href: '/docs/publishing/versioning' },
        { title: '最佳实践', href: '/docs/publishing/best-practices', badge: '推荐' },
      ],
    },
    {
      title: 'CLI 参考',
      description: '命令行工具的详细用法',
      icon: <CommandIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '命令概览', href: '/docs/cli/overview' },
        { title: '服务器管理', href: '/docs/cli/servers' },
        { title: '账户管理', href: '/docs/cli/account' },
        { title: '配置设置', href: '/docs/cli/config' },
        { title: '高级用法', href: '/docs/cli/advanced' },
      ],
    },
    {
      title: 'API 文档',
      description: '与仓库交互的REST API',
      icon: <CodeIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: 'API概览', href: '/docs/api/overview' },
        { title: '服务器操作', href: '/docs/api/servers' },
        { title: '用户认证', href: '/docs/api/auth' },
        { title: '搜索API', href: '/docs/api/search' },
        { title: '同步API', href: '/docs/api/sync' },
      ],
    },
    {
      title: '开发者资源',
      description: '构建与仓库集成的应用',
      icon: <FileTextIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: 'SDK文档', href: '/docs/dev/sdk', badge: '新' },
        { title: 'Webhook集成', href: '/docs/dev/webhooks' },
        { title: '自定义客户端', href: '/docs/dev/custom-clients' },
        { title: '插件开发', href: '/docs/dev/plugins' },
        { title: '贡献指南', href: '/docs/dev/contributing' },
      ],
    },
    {
      title: '高级主题',
      description: '深入理解MCP服务器生态系统',
      icon: <SettingsIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '服务器架构', href: '/docs/advanced/architecture' },
        { title: '安全最佳实践', href: '/docs/advanced/security' },
        { title: '性能优化', href: '/docs/advanced/performance' },
        { title: '企业级部署', href: '/docs/advanced/enterprise' },
        { title: '自动化和CI/CD', href: '/docs/advanced/automation' },
      ],
    },
    {
      title: '社区与支持',
      description: '获取帮助并参与社区',
      icon: <UsersIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '获取支持', href: '/docs/community/support' },
        { title: '社区指南', href: '/docs/community/guidelines' },
        { title: '举报问题', href: '/docs/community/reporting' },
        { title: '贡献代码', href: '/docs/community/contributing' },
        { title: '加入讨论', href: '/docs/community/discussions' },
      ],
    },
    {
      title: '安全与合规',
      description: '了解我们的安全措施和合规政策',
      icon: <ShieldIcon className="h-5 w-5 text-primary" />,
      links: [
        { title: '安全政策', href: '/docs/security/policy' },
        { title: '漏洞报告', href: '/docs/security/vulnerabilities' },
        { title: '数据保护', href: '/docs/security/data-protection' },
        { title: '隐私政策', href: '/docs/security/privacy' },
        { title: '服务条款', href: '/docs/security/terms' },
      ],
    },
  ];

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">文档中心</h1>
          <p className="text-xl text-muted-foreground">
            全面了解MCPR系统，帮助您快速开始使用和发布MCP服务器
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <DocCategory key={index} {...category} />
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-4">没有找到您需要的内容？</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-2">加入我们的社区</h3>
              <p className="text-sm text-muted-foreground mb-2">
                与其他用户和开发者交流，分享经验和解决问题。
              </p>
              <Link href="/community" className="text-primary text-sm hover:underline">
                访问社区
              </Link>
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">联系技术支持</h3>
              <p className="text-sm text-muted-foreground mb-2">
                有技术问题？我们的支持团队随时为您提供帮助。
              </p>
              <Link href="/support" className="text-primary text-sm hover:underline">
                获取支持
              </Link>
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">提交文档改进</h3>
              <p className="text-sm text-muted-foreground mb-2">
                发现文档中的错误或有改进建议？请告诉我们。
              </p>
              <Link href="/docs/contribute" className="text-primary text-sm hover:underline">
                贡献文档
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 