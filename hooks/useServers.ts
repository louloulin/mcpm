'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Server, SearchResult } from '../lib/api-client';

// 服务器Hook参数
interface UseServersOptions {
  limit?: number;
  initialPage?: number;
}

// 服务器Hook返回值
interface UseServersReturn {
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  refetch: () => Promise<void>;
  search: (query: string, tags?: string[]) => Promise<void>;
}

/**
 * 服务器数据Hook
 */
export function useServers({
  limit = 10,
  initialPage = 1,
}: UseServersOptions = {}): UseServersReturn {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(limit);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);

  // 计算偏移量
  const offset = (page - 1) * pageSize;

  // 获取服务器数据
  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result: SearchResult<Server>;

      if (searchQuery) {
        // 如果有搜索查询，使用搜索API
        result = await apiClient.searchServers(searchQuery, searchTags, {
          limit: pageSize,
          offset,
        });
      } else {
        // 否则获取所有服务器
        result = await apiClient.getAllServers({
          limit: pageSize,
          offset,
        });
      }

      setServers(result.items || []);  // 确保即使 items 为 undefined 也设置为空数组
      setTotal(result.total || 0);     // 确保即使 total 为 undefined 也设置为 0
    } catch (err) {
      console.error('获取服务器失败:', err);
      setError('获取服务器列表失败，请稍后再试。');
      setServers([]);  // 在错误时重置为空数组
      setTotal(0);     // 在错误时重置总数为 0
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, offset, searchQuery, searchTags]);

  // 搜索服务器
  const search = async (query: string, tags: string[] = []) => {
    setSearchQuery(query);
    setSearchTags(tags);
    setPage(1); // 重置为第一页
  };

  // 当依赖项变化时获取数据
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 当页面大小改变时，重置为第一页
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return {
    servers,
    isLoading,
    error,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    refetch: fetchServers,
    search,
  };
} 