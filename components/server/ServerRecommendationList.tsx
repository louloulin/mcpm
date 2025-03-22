'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface ServerRecommendation {
  id: string;
  name: string;
  description: string;
  version: string;
  downloads: number;
  rating: number;
  score: number;
  reason: string;
}

export function ServerRecommendationList({ limit = 5 }: { limit?: number }) {
  const [recommendations, setRecommendations] = useState<ServerRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recommendations?limit=${limit}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '获取推荐失败');
        }
        
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err: any) {
        console.error('获取推荐时出错:', err);
        setError(err.message || '获取推荐失败');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>无法加载推荐</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>暂无推荐</CardTitle>
        </CardHeader>
        <CardContent>
          <p>我们目前没有针对您的推荐。请尝试浏览更多服务器或稍后再来查看。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className="w-full hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{recommendation.name}</CardTitle>
                <CardDescription className="flex items-center text-xs gap-1 mt-1">
                  <span>v{recommendation.version}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center">
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    {recommendation.downloads.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center">
                    <StarIcon className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    {recommendation.rating.toFixed(1)}
                  </span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                推荐指数: {Math.round(recommendation.score)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {recommendation.description}
            </p>
            <p className="text-xs text-primary italic">
              {recommendation.reason}
            </p>
          </CardContent>
          <CardFooter className="pt-2">
            <Link href={`/servers/${recommendation.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                <span>查看详情</span>
                <ExternalLinkIcon className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 