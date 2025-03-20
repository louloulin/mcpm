"use client"

import React from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  py?: number;
  px?: number;
}

const Layout = ({ 
  children, 
  title = 'MCP Cloud - 服务器托管平台',
  maxWidth = 'xl', 
  py = 8, 
  px = 4 
}: LayoutProps) => {
  // 将传入的 maxWidth 映射到 Tailwind 类
  const maxWidthClass = {
    'sm': 'max-w-screen-sm',
    'md': 'max-w-screen-md',
    'lg': 'max-w-screen-lg',
    'xl': 'max-w-screen-xl',
    'full': 'max-w-full',
  }[maxWidth];

  // 将数字形式的 padding 转换为 Tailwind 类
  const paddingY = `py-${py}`;
  const paddingX = `px-${px}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="MCP Cloud - 发现、部署和管理MCP服务器" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="flex-1">
        <div className={`mx-auto ${maxWidthClass} ${paddingY} ${paddingX}`}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Layout; 