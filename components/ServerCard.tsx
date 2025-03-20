"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Download, Star } from "lucide-react"
import Link from "next/link"

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    description: string;
    version: string;
    author: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    downloads: number;
    rating?: number;
    createdAt: string;
    tags: string[];
  };
}

export default function ServerCard({ server }: ServerCardProps) {
  // 计算创建日期的格式化字符串
  const formattedDate = new Date(server.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // 为评分生成星星
  const renderRating = () => {
    if (!server.rating) return null;
    
    return (
      <div className="flex items-center">
        <Star className="h-4 w-4 text-yellow-400 mr-1" />
        <span className="text-sm font-medium">{server.rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold truncate">{server.name}</CardTitle>
          <Badge variant="outline" className="text-xs">v{server.version}</Badge>
        </div>
        <CardDescription className="line-clamp-2 h-10 text-sm">
          {server.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 flex-1">
        <div className="flex flex-wrap gap-1 mb-3">
          {server.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {server.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{server.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            <span>{server.downloads}</span>
          </div>
          {renderRating()}
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        <div className="flex items-center">
          <Avatar className="h-7 w-7 mr-2">
            <AvatarImage src={server.author.avatarUrl} />
            <AvatarFallback>{server.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{server.author.name}</span>
        </div>
        
        <Link href={`/servers/${server.id}`}>
          <Button variant="outline" size="sm">查看详情</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 