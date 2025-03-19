import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './lib/auth';

// 定义需要保护的路径
const protectedPaths = [
  '/dashboard',
  '/api/v1/servers/create',
  '/api/v1/users/me'
];

// 定义需要管理员权限的路径
const adminPaths = [
  '/admin',
  '/api/v1/stats/logs',
  '/api/v1/sync/trigger'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否是需要保护的路径
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  // 检查是否是需要管理员权限的路径
  const isAdminPath = adminPaths.some(path => 
    pathname.startsWith(path)
  );
  
  // 如果路径不需要保护，直接放行
  if (!isProtectedPath && !isAdminPath) {
    return NextResponse.next();
  }
  
  // 获取认证令牌
  const token = request.cookies.get('token')?.value;
  
  // 如果没有token，重定向到登录页
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  try {
    // 验证token
    const { isValid, user } = await verifyAuth(token);
    
    if (!isValid) {
      throw new Error('Invalid token');
    }
    
    // 检查管理员权限
    if (isAdminPath && user?.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }
    
    // 在请求中添加用户信息
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user?.id || '');
    requestHeaders.set('x-user-role', user?.role || '');
    
    // 继续处理请求
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (_error) {
    // 认证失败，重定向到登录页
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
}

// 配置中间件应用的路径
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/v1/servers/:path*',
    '/api/v1/users/:path*',
    '/api/v1/sync/:path*',
    '/api/v1/stats/:path*'
  ]
}; 