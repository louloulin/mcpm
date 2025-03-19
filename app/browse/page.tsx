'use client';

import { useState } from 'react';
import { useServers } from '../../hooks/useServers';
import { Server } from '../../lib/api-client';
import ServerCard from '../../components/server-card';
import { Search, Filter, Tag, X } from 'lucide-react';

export default function BrowsePage() {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const {
    servers,
    isLoading,
    error,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
  } = useServers();

  // 常用标签
  const popularTags = [
    'ai', 'nlp', 'vision', 'audio', 'speech',
    'tools', 'utilities', 'productivity', 'content-generation'
  ];

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query, selectedTags);
  };

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 清除所有筛选条件
  const clearFilters = () => {
    setQuery('');
    setSelectedTags([]);
    search('', []);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">浏览服务器</h1>

      {/* 搜索表单 */}
      <form 
        onSubmit={handleSearchSubmit}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="搜索服务器..."
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            搜索
          </button>
        </div>
        
        {/* 标签过滤器 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Filter className="h-4 w-4" />
            <span>按标签筛选：</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        {/* 活跃过滤器显示 */}
        {(query || selectedTags.length > 0) && (
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600 mr-2">筛选条件:</span>
            
            {query && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {query}
                <button 
                  type="button" 
                  onClick={() => setQuery('')}
                  className="ml-1 inline-flex flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {selectedTags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2"
              >
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleTagClick(tag)}
                  className="ml-1 inline-flex flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              清除全部
            </button>
          </div>
        )}
      </form>

      {/* 结果统计 */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {isLoading ? (
            '加载中...'
          ) : (
            <>
              找到 <span className="font-semibold">{total}</span> 个服务器
              {query && (
                <span> 匹配 &quot;{query}&quot;</span>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">每页显示:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded py-1 px-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 my-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">加载失败</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 服务器列表 */}
      {isLoading ? (
        // 加载骨架屏
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <div 
              key={index} 
              className="animate-pulse bg-gray-100 rounded-lg overflow-hidden shadow h-64"
            />
          ))}
        </div>
      ) : servers && servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server: Server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">未找到服务器</p>
          <p className="text-gray-400 text-sm mt-2">尝试使用不同的搜索条件，或清除筛选项</p>
        </div>
      )}

      {/* 分页 */}
      {servers && servers.length > 0 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                上一页
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page * pageSize >= total
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">上一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    第 {page} 页，共 {Math.ceil(total / pageSize)} 页
                  </div>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= total}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      page * pageSize >= total
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">下一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
} 