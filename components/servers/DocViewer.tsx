"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { 
  BookOpen, 
  Code, 
  Search, 
  Server, 
  ChevronRight, 
  ChevronDown,
  Edit,
  Share,
  Download,
  Copy,
  ExternalLink,
  Plus
} from "lucide-react"

interface DocSection {
  id: string
  title: string
  content: string
  subsections?: DocSection[]
}

interface DocPage {
  id: string
  title: string
  slug: string
  sections: DocSection[]
}

interface APIEndpoint {
  id: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  path: string
  description: string
  parameters?: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
  responses?: {
    code: number
    description: string
    example?: string
  }[]
}

interface DocViewerProps {
  pages: DocPage[]
  apiEndpoints?: APIEndpoint[]
  currentPageId?: string
}

export default function DocViewer({ 
  pages, 
  apiEndpoints = [], 
  currentPageId 
}: DocViewerProps) {
  const [activePage, setActivePage] = useState(currentPageId || (pages.length > 0 ? pages[0].id : ""));
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  const currentPage = pages.find(page => page.id === activePage);
  
  // 处理章节展开/折叠
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 处理搜索输入
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* 侧边导航 */}
      <div className="w-full lg:w-64 shrink-0">
        <Card className="sticky top-6">
          <CardHeader className="py-3">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">API 文档</CardTitle>
            </div>
            <CardDescription>
              了解如何使用此服务器的API
            </CardDescription>
            
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文档..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </CardHeader>
          
          <CardContent className="px-2 py-0">
            <Tabs defaultValue="docs" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="docs" className="text-xs">
                  <BookOpen className="h-4 w-4 mr-2" /> 文档
                </TabsTrigger>
                <TabsTrigger value="api" className="text-xs">
                  <Code className="h-4 w-4 mr-2" /> API
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="docs" className="mt-0 max-h-[60vh] overflow-y-auto pr-2">
                <nav className="space-y-1">
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setActivePage(page.id)}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-sm rounded-md",
                        activePage === page.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{page.title}</span>
                    </button>
                  ))}
                </nav>
              </TabsContent>
              
              <TabsContent value="api" className="mt-0 max-h-[60vh] overflow-y-auto pr-2">
                <nav className="space-y-1">
                  {apiEndpoints.map(endpoint => (
                    <div key={endpoint.id} className="text-sm">
                      <div className="flex items-center px-2 py-1.5">
                        <span 
                          className={cn(
                            "px-2 py-0.5 rounded text-xs mr-2 font-mono",
                            endpoint.method === "GET" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            endpoint.method === "POST" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                            endpoint.method === "PUT" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                            endpoint.method === "DELETE" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                            endpoint.method === "PATCH" && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          )}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-xs truncate font-mono">{endpoint.path}</code>
                      </div>
                    </div>
                  ))}
                </nav>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between py-3">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              编辑文档
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* 文档内容 */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{currentPage?.title}</CardTitle>
                <CardDescription>
                  最后更新于 2023-11-15
                </CardDescription>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  分享
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {currentPage ? (
              <div className="space-y-8">
                {currentPage.sections.map(section => (
                  <div key={section.id} className="space-y-4">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      {section.subsections && section.subsections.length > 0 ? (
                        expandedSections[section.id] ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground mr-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground mr-2" />
                        )
                      ) : (
                        <div className="w-5 mr-2" />
                      )}
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none pl-7">
                      <ReactMarkdown>{section.content}</ReactMarkdown>
                    </div>
                    
                    {section.subsections && section.subsections.length > 0 && expandedSections[section.id] && (
                      <div className="pl-7 space-y-6 mt-4">
                        {section.subsections.map(subsection => (
                          <div key={subsection.id} className="space-y-4">
                            <h3 className="text-xl font-semibold">{subsection.title}</h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <ReactMarkdown>{subsection.content}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-medium mb-2">没有选择文档</h3>
                <p className="text-muted-foreground mb-4">请从左侧选择一个文档页面或创建新文档</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建文档
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t py-4">
            <div className="text-sm text-muted-foreground">
              此文档对您有帮助吗？
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                复制链接
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看 API 示例
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 