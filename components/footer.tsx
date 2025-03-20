"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 mt-20 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-start">
            <h2 className="font-medium text-lg mb-2">
              MCP Cloud
            </h2>
            <Link href="/" className="hover:text-blue-500 transition-colors">首页</Link>
            <Link href="/about" className="hover:text-blue-500 transition-colors">关于我们</Link>
            <Link href="/contact" className="hover:text-blue-500 transition-colors">联系我们</Link>
          </div>
          <div className="flex flex-col items-start">
            <h2 className="font-medium text-lg mb-2">
              服务器
            </h2>
            <Link href="/servers" className="hover:text-blue-500 transition-colors">MCP</Link>
            <Link href="/upload" className="hover:text-blue-500 transition-colors">上传服务器</Link>
            <Link href="/docs" className="hover:text-blue-500 transition-colors">开发文档</Link>
          </div>
          <div className="flex flex-col items-start">
            <h2 className="font-medium text-lg mb-2">
              资源
            </h2>
            <Link href="/docs" className="hover:text-blue-500 transition-colors">API文档</Link>
            <a href="https://mcp.ai/docs" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">MCP协议</a>
            <Link href="/blog" className="hover:text-blue-500 transition-colors">博客</Link>
          </div>
          <div className="flex flex-col items-start">
            <h2 className="font-medium text-lg mb-2">
              法律信息
            </h2>
            <Link href="/privacy" className="hover:text-blue-500 transition-colors">隐私政策</Link>
            <Link href="/terms" className="hover:text-blue-500 transition-colors">使用条款</Link>
            <Link href="/cookies" className="hover:text-blue-500 transition-colors">Cookie政策</Link>
          </div>
        </div>
      </div>
      <div className="py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
          <p>© {new Date().getFullYear()} MCP Cloud. 保留所有权利</p>
        </div>
      </div>
    </footer>
  );
}
