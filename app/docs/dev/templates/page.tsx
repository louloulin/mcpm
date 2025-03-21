"use client";

import { useState } from 'react';
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileCode, Copy, Info } from 'lucide-react';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-12">
      <div className="space-y-4 mb-10">
        <h1 className="text-4xl font-bold">MCP 模板</h1>
        <p className="text-xl text-muted-foreground">快速搭建MCP项目的模板和脚手架</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">目录</p>
              <div className="space-y-1 text-sm">
                <a href="#overview" className="block py-1 text-muted-foreground hover:text-primary">模板概述</a>
                <a href="#starter-templates" className="block py-1 text-muted-foreground hover:text-primary">入门模板</a>
                <a href="#specialized-templates" className="block py-1 text-muted-foreground hover:text-primary">专用模板</a>
                <a href="#custom-templates" className="block py-1 text-muted-foreground hover:text-primary">自定义模板</a>
                <a href="#best-practices" className="block py-1 text-muted-foreground hover:text-primary">最佳实践</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-xl">
              <TabsTrigger value="overview">模板概述</TabsTrigger>
              <TabsTrigger value="usage">使用指南</TabsTrigger>
              <TabsTrigger value="examples">示例代码</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <section id="overview" className="space-y-4">
                <h2 className="text-2xl font-bold">模板概述</h2>
                <Separator className="my-2" />
                <p>MCP模板是用于快速创建符合MCP规范的项目的脚手架工具，为开发者提供可靠的起点，减少重复性工作。</p>
                
                <Alert className="my-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>为什么使用模板？</AlertTitle>
                  <AlertDescription>
                    使用官方模板可以确保遵循最佳实践，快速搭建项目结构，并获得预配置的开发环境。
                  </AlertDescription>
                </Alert>
                
                <p>所有模板都包含以下核心功能：</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>符合MCP协议的API结构</li>
                  <li>预配置的开发环境和依赖项</li>
                  <li>内置验证和错误处理</li>
                  <li>示例工具实现</li>
                  <li>测试框架</li>
                </ul>
              </section>
            </TabsContent>

            <TabsContent value="usage" className="space-y-8">
              <section id="starter-templates" className="space-y-4">
                <h2 className="text-2xl font-bold">入门模板</h2>
                <Separator className="my-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        Node.js/Express
                      </CardTitle>
                      <CardDescription>基于Express.js的轻量级MCP服务器</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        适合大多数Web开发者，提供灵活的API结构和中间件支持。
                      </p>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <code>npx create-mcp-app my-server --template express</code>
                      </pre>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <Link href="https://github.com/mastra-ai/templates/tree/main/express">
                          查看源码
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => copyToClipboard("npx create-mcp-app my-server --template express")}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        复制命令
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        Python/FastAPI
                      </CardTitle>
                      <CardDescription>基于FastAPI的高性能Python MCP服务器</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        适合Python开发者，提供自动API文档和强类型支持。
                      </p>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <code>pip install cookiecutter
cookiecutter gh:mastra-ai/mcp-fastapi-template</code>
                      </pre>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <Link href="https://github.com/mastra-ai/mcp-fastapi-template">
                          查看源码
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => copyToClipboard("pip install cookiecutter\ncookiecutter gh:mastra-ai/mcp-fastapi-template")}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        复制命令
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </section>

              <section id="specialized-templates" className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold">专用模板</h2>
                <Separator className="my-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        数据处理模板
                      </CardTitle>
                      <CardDescription>针对数据处理和分析的MCP服务</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        集成了常用数据处理库，适合构建数据分析和可视化工具。
                      </p>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <code>npx create-mcp-app data-server --template data-processing</code>
                      </pre>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <Link href="https://github.com/mastra-ai/templates/tree/main/data-processing">
                          查看源码
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => copyToClipboard("npx create-mcp-app data-server --template data-processing")}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        复制命令
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileCode className="h-5 w-5 mr-2" />
                        企业级模板
                      </CardTitle>
                      <CardDescription>适合企业级部署的完整MCP解决方案</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        包含认证、日志、监控和扩展功能，适合大规模应用。
                      </p>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <code>npx create-mcp-app enterprise-server --template enterprise</code>
                      </pre>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <Link href="https://github.com/mastra-ai/templates/tree/main/enterprise">
                          查看源码
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => copyToClipboard("npx create-mcp-app enterprise-server --template enterprise")}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        复制命令
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="examples" className="space-y-8">
              <section id="custom-templates" className="space-y-4">
                <h2 className="text-2xl font-bold">自定义模板</h2>
                <Separator className="my-2" />
                
                <p>您可以基于官方模板创建自定义模板，或从头开始构建：</p>
                
                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="custom-nodejs">
                    <AccordionTrigger>创建自定义Node.js模板</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm">1. 克隆基础模板：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`git clone https://github.com/mastra-ai/templates.git
cd templates/express`}</code>
                        </pre>
                        
                        <p className="text-sm">2. 修改模板内容：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`# 根据需要修改文件结构和代码
# template.json 包含模板配置信息`}</code>
                        </pre>
                        
                        <p className="text-sm">3. 发布到GitHub：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`# 上传到您的GitHub仓库
git remote set-url origin https://github.com/your-username/your-template.git
git push origin main`}</code>
                        </pre>

                        <p className="text-sm">4. 使用自定义模板：</p>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                          <code>{`npx create-mcp-app my-app --template github:your-username/your-template`}</code>
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              <section id="best-practices" className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold">最佳实践</h2>
                <Separator className="my-2" />
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">选择合适的模板</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>根据项目规模和复杂度选择基础模板或专用模板</li>
                    <li>考虑团队的技术栈和熟悉度</li>
                    <li>评估性能和可扩展性需求</li>
                  </ul>

                  <h3 className="text-xl font-medium">定制与扩展</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>保持核心MCP协议接口不变</li>
                    <li>在扩展功能前先了解模板的整体架构</li>
                    <li>为自定义功能编写充分的测试</li>
                    <li>记录重大更改和自定义配置</li>
                  </ul>

                  <h3 className="text-xl font-medium">部署考虑</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>模板通常预配置了开发环境，但可能需要调整生产设置</li>
                    <li>确保安全凭据不包含在版本控制中</li>
                    <li>考虑使用CI/CD管道自动化部署流程</li>
                  </ul>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 