"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Star, Search, Filter, FileCode } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 模拟的MCP服务器数据
const MOCK_SERVERS = [
  {
    id: 'server-1',
    name: '简单问候MCP服务器',
    description: '基础的问候服务，提供友好的API接口',
    version: '1.0.0',
    downloads: 1240,
    rating: 4.5,
    author: {
      id: 'user1',
      name: '张三',
      avatarUrl: 'https://i.pravatar.cc/100?u=1',
    },
    tags: ['入门', '示例', '简单'],
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'server-2',
    name: '天气查询MCP服务器',
    description: '获取全球各主要城市的实时天气信息和预报',
    version: '2.1.0',
    downloads: 3450,
    rating: 4.8,
    author: {
      id: 'user2',
      name: '李四',
      avatarUrl: 'https://i.pravatar.cc/100?u=2',
    },
    tags: ['天气', 'API', '实用'],
    createdAt: '2023-02-20T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
  },
  {
    id: 'server-3',
    name: '图像处理MCP服务器',
    description: '提供图像处理、变换和优化功能的MCP服务',
    version: '0.9.5',
    downloads: 980,
    rating: 4.2,
    author: {
      id: 'user3',
      name: '王五',
      avatarUrl: 'https://i.pravatar.cc/100?u=3',
    },
    tags: ['图像', '处理', 'Beta'],
    createdAt: '2023-03-10T00:00:00Z',
    updatedAt: '2023-05-01T00:00:00Z',
  },
  {
    id: 'server-4',
    name: '翻译工具MCP服务器',
    description: '多语言翻译服务，支持50+种语言互译',
    version: '3.2.1',
    downloads: 5680,
    rating: 4.9,
    author: {
      id: 'user4',
      name: '赵六',
      avatarUrl: 'https://i.pravatar.cc/100?u=4',
    },
    tags: ['翻译', '语言', '多语言'],
    createdAt: '2022-11-05T00:00:00Z',
    updatedAt: '2023-06-12T00:00:00Z',
  },
  {
    id: 'server-5',
    name: '数据分析MCP服务器',
    description: '提供数据统计、分析和可视化功能',
    version: '1.3.0',
    downloads: 2100,
    rating: 4.6,
    author: {
      id: 'user5',
      name: '孙七',
      avatarUrl: 'https://i.pravatar.cc/100?u=5',
    },
    tags: ['数据', '分析', '统计'],
    createdAt: '2023-01-30T00:00:00Z',
    updatedAt: '2023-04-28T00:00:00Z',
  }
];

// 类型定义
interface ServerAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

interface Server {
  id: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  author: ServerAuthor;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 排序选项
const SORT_OPTIONS = [
  { value: 'downloads', label: '下载量' },
  { value: 'rating', label: '评分' },
  { value: 'newest', label: '最新发布' },
  { value: 'updated', label: '最近更新' }
];

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 获取所有可用标签
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    MOCK_SERVERS.forEach(server => {
      server.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, []);

  useEffect(() => {
    // 模拟API请求
    const fetchServers = async () => {
      try {
        setLoading(true);
        
        // 在实际应用中，这里会调用API
        // const response = await fetch('/api/servers');
        // const data = await response.json();
        
        // 使用模拟数据
        setTimeout(() => {
          setServers(MOCK_SERVERS);
          setFilteredServers(MOCK_SERVERS);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  // 当搜索词、排序方式或标签过滤发生变化时，更新过滤后的服务器列表
  useEffect(() => {
    let result = [...servers];
    
    // 应用搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(server => 
        server.name.toLowerCase().includes(term) || 
        server.description.toLowerCase().includes(term) ||
        server.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // 应用标签过滤
    if (selectedTags.length > 0) {
      result = result.filter(server => 
        selectedTags.some(tag => server.tags.includes(tag))
      );
    }
    
    // 应用排序
    if (sortBy === 'downloads') {
      result = result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'rating') {
      result = result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'updated') {
      result = result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
    setFilteredServers(result);
  }, [servers, searchTerm, sortBy, selectedTags]);

  // 处理搜索输入
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 处理排序选择
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  // 清除所有过滤器
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSortBy('downloads');
  };

  // 渲染服务器卡片
  const renderServerCard = (server: Server) => (
    <Card key={server.id} className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">
          <Link 
            href={`/servers/${server.id}`}
            className="hover:text-primary transition-colors"
          >
            {server.name}
          </Link>
        </CardTitle>
        <div className="flex mt-1">
          <div className="flex items-center mr-4">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{server.rating}</span>
          </div>
          <div className="flex items-center">
            <Download className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-sm text-muted-foreground">{server.downloads.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-3">{server.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {server.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center mt-2">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={server.author.avatarUrl} alt={server.author.name} />
            <AvatarFallback>{server.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{server.author.name}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full"
          onClick={() => router.push(`/servers/${server.id}`)}
        >
          <FileCode className="mr-2 h-4 w-4" />
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">MCP服务器目录</h1>
          <p className="text-muted-foreground">
            发现和使用高质量的MCP服务器，扩展您的AI模型能力
          </p>
        </div>
        <Button 
          variant="default" 
          className="mt-4 md:mt-0"
          onClick={() => router.push('/docs')}
        >
          查看MCP文档
        </Button>
      </div>

      {/* 搜索和过滤区域 */}
      <div className="bg-muted/40 rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索MCP服务器..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  标签过滤
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{selectedTags.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>选择标签</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                  {allTags.map(tag => (
                    <DropdownMenuItem key={tag} onClick={() => toggleTag(tag)}>
                      <div className="flex items-center justify-between w-full">
                        <span>{tag}</span>
                        {selectedTags.includes(tag) && (
                          <Badge variant="outline" className="ml-2">✓</Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {selectedTags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center" onClick={clearFilters}>
                      <Button variant="ghost" size="sm" className="w-full">清除所有过滤器</Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 所选标签展示 */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <span className="text-xs">×</span>
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={clearFilters}
            >
              清除所有
            </Button>
          </div>
        )}
      </div>

      {/* 服务器卡片列表 */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin mb-4">
              <FileCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">加载MCP服务器列表...</p>
          </div>
        </div>
      ) : filteredServers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map(renderServerCard)}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/20 rounded-lg">
          <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium mb-2">未找到匹配的MCP服务器</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            尝试更改您的搜索词或过滤条件，或浏览我们的全部服务器目录。
          </p>
          <Button variant="outline" onClick={clearFilters}>
            清除所有过滤器
          </Button>
        </div>
      )}
    </div>
  );
} 