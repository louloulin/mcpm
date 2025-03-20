import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  GitBranchIcon,
  CodeIcon,
  ServerIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  GitPullRequestIcon,
  GithubIcon,
  GitlabIcon,
  CircleDotIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'CI/CD集成 | MCPM',
  description: '将MCPM服务器与您的CI/CD流程集成，实现自动测试和部署',
};

export default function CICDPage() {
  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">CI/CD集成</h1>
          <p className="text-xl text-muted-foreground">
            将MCPM服务器与您的持续集成和部署流程无缝集成
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranchIcon className="h-5 w-5 text-primary" />
                <CardTitle>自动构建与发布</CardTitle>
              </div>
              <CardDescription>
                通过CI/CD自动构建和发布MCP服务器
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>代码提交或合并时自动构建和测试</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>根据语义化版本自动发布版本</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>支持不同环境的部署策略</span>
                  </li>
                </ul>
                <Button className="w-full">查看文档</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CodeIcon className="h-5 w-5 text-primary" />
                <CardTitle>自动测试与验证</CardTitle>
              </div>
              <CardDescription>
                确保服务器在发布前通过全面测试
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>自动运行单元测试和集成测试</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>验证服务器功能和接口符合MCP规范</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>生成测试报告和覆盖率分析</span>
                  </li>
                </ul>
                <Button className="w-full">探索测试工具</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ServerIcon className="h-5 w-5 text-primary" />
                <CardTitle>环境管理</CardTitle>
              </div>
              <CardDescription>
                管理不同环境中的MCP服务器部署
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>支持开发、测试和生产环境</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>环境特定配置和变量管理</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>蓝绿部署和金丝雀发布</span>
                  </li>
                </ul>
                <Button className="w-full">环境配置指南</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">支持的CI/CD平台</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center p-6">
              <GithubIcon className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">GitHub Actions</h3>
              <p className="text-center text-sm text-muted-foreground my-2">
                直接在GitHub仓库中运行的工作流
              </p>
              <Badge className="mt-2">推荐</Badge>
              <Button variant="outline" className="mt-4 w-full">查看示例</Button>
            </Card>

            <Card className="flex flex-col items-center p-6">
              <GitlabIcon className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">GitLab CI/CD</h3>
              <p className="text-center text-sm text-muted-foreground my-2">
                GitLab内置的CI/CD流水线
              </p>
              <Button variant="outline" className="mt-4 w-full">查看示例</Button>
            </Card>

            <Card className="flex flex-col items-center p-6">
              <CircleDotIcon className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">CircleCI</h3>
              <p className="text-center text-sm text-muted-foreground my-2">
                云原生持续集成平台
              </p>
              <Button variant="outline" className="mt-4 w-full">查看示例</Button>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            我们还支持Jenkins、Travis CI、Azure DevOps等其他CI/CD平台。
          </p>
        </div>

        <div className="mt-12 bg-muted p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">CI/CD集成工作流</h2>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-12 border-l-2 border-dashed border-primary-foreground/20"></div>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary">
                    <GitPullRequestIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold">1. 代码变更</h3>
                  <p className="text-muted-foreground mt-2">
                    开发者提交代码或创建合并请求，触发CI/CD流程
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary">
                    <CodeIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold">2. 构建与测试</h3>
                  <p className="text-muted-foreground mt-2">
                    自动构建代码并运行测试套件，确保质量
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary">
                    <RefreshCwIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold">3. 发布与部署</h3>
                  <p className="text-muted-foreground mt-2">
                    通过MCPM CLI自动发布新版本并部署到目标环境
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">开始集成</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-6">
            使用我们的CI/CD集成工具包，只需几分钟即可设置自动化流程，提高开发效率并确保服务器质量。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <GitBranchIcon className="h-4 w-4" />
              查看CI/CD指南
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <CodeIcon className="h-4 w-4" />
              查看示例配置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 