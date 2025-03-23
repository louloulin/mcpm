import React from 'react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// 简单封装的认证检查函数
const checkAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 检查cookie中的token
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
  const authTokenCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
  
  // 检查localStorage中的token
  const localStorageToken = localStorage.getItem('auth_token');
  
  // 检查sessionStorage中的token
  const sessionStorageToken = sessionStorage.getItem('auth_token');
  
  console.log('Auth check:', {
    tokenCookie: tokenCookie ? 'exists' : 'missing',
    authTokenCookie: authTokenCookie ? 'exists' : 'missing',
    localStorageToken: localStorageToken ? 'exists' : 'missing',
    sessionStorageToken: sessionStorageToken ? 'exists' : 'missing'
  });
  
  return !!(tokenCookie || authTokenCookie || localStorageToken || sessionStorageToken);
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  useEffect(() => {
    // 检查要访问的路径是否需要认证
    const protectedPaths = ['/dashboard', '/my-servers', '/servers/my', '/profile', '/settings'];
    const currentPath = router.pathname;
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
    
    if (isProtectedPath) {
      console.log('访问受保护路径:', currentPath);
      const isAuthenticated = checkAuth();
      
      if (!isAuthenticated) {
        console.log('未认证，重定向到登录页');
        router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      } else {
        console.log('认证通过');
      }
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}

export default MyApp; 