'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';

// 客户端认证检查钩子
const useClientAuth = () => {
  const { user, isLoading } = useAuth();
  const [isClientAuthenticated, setIsClientAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkClientAuth = () => {
      try {
        // 检查上下文中的用户
        if (user) {
          console.log('通过上下文认证成功:', user.name);
          setIsClientAuthenticated(true);
          return true;
        }

        // 检查cookie
        const cookies = document.cookie.split('; ');
        const hasTokenCookie = cookies.some(c => c.startsWith('token=') || c.startsWith('auth_token='));
        
        // 检查localStorage和sessionStorage
        const hasLocalToken = !!localStorage.getItem('auth_token');
        const hasSessionToken = !!sessionStorage.getItem('auth_token');
        
        const isAuthenticated = hasTokenCookie || hasLocalToken || hasSessionToken;
        
        console.log('客户端认证检查结果:', { 
          hasTokenCookie, 
          hasLocalToken, 
          hasSessionToken,
          isAuthenticated
        });
        
        setIsClientAuthenticated(isAuthenticated);
        return isAuthenticated;
      } catch (err) {
        console.error('客户端认证检查错误:', err);
        setIsClientAuthenticated(false);
        return false;
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // 只在客户端运行
    if (typeof window !== 'undefined') {
      checkClientAuth();
    }
  }, [user]);

  return { 
    isAuthenticated: isClientAuthenticated, 
    isCheckingAuth: isCheckingAuth || isLoading 
  };
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth } = useClientAuth();
  
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated === false) {
      console.log('未认证，重定向到登录页面');
      const currentPath = window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isCheckingAuth, router]);

  // 显示加载状态
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 未认证时不显示内容
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <SideNav />
      <div className="flex-1 overflow-auto">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 