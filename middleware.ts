import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

// 受保护的路径前缀
const PROTECTED_PATHS = [
  '/dashboard',
  '/servers/my',
  '/my-servers',
  '/profile',
  '/settings',
  '/api/v1/servers/my'
];

// 调试日志函数
const debugLog = (message: string, obj?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[中间件] ${message}`, obj ? obj : '');
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否为受保护路径
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  debugLog(`处理路径: ${pathname}, 是否受保护: ${isProtectedPath}`);
  
  if (!isProtectedPath) {
    debugLog('路径不受保护，跳过中间件');
    return NextResponse.next();
  }
  
  // 从多种来源检索令牌
  let token = null;
  
  // 1. 从cookie中获取令牌
  const tokenCookie = request.cookies.get('token')?.value;
  const authTokenCookie = request.cookies.get('auth_token')?.value;
  
  // 2. 从Authorization头中获取令牌
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // 使用找到的第一个有效令牌
  token = tokenCookie || authTokenCookie || bearerToken;
  
  debugLog('令牌检查结果:', { 
    hasCookieToken: !!tokenCookie, 
    hasAuthCookieToken: !!authTokenCookie,
    hasBearerToken: !!bearerToken,
    hasAnyToken: !!token
  });
  
  // 如果没有令牌，重定向到登录页面
  if (!token) {
    debugLog('未找到令牌，重定向到登录页面');
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  try {
    // 验证令牌 (现在是异步的)
    const decodedToken = await verifyToken(token);
    
    // 检查令牌验证结果
    if (!decodedToken) {
      throw new Error('令牌验证失败或无效令牌');
    }
    
    const userId = decodedToken.id || decodedToken.sub;
    debugLog('令牌验证成功:', { userId });
    
    // 设置请求头中的用户信息，以便传递给API路由
    const requestHeaders = new Headers(request.headers);
    if (decodedToken.id) requestHeaders.set('x-user-id', decodedToken.id);
    if (decodedToken.role) requestHeaders.set('x-user-role', decodedToken.role);
    
    // 验证通过，继续请求
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    debugLog('令牌验证失败:', error);
    
    // 令牌验证失败，清除所有相关cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { 
      path: '/', 
      maxAge: 0 
    });
    response.cookies.set('auth_token', '', { 
      path: '/', 
      maxAge: 0 
    });
    
    // 重定向到登录页面并带上回调URL
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

// 配置匹配器，确保覆盖所有受保护路径
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/servers/my/:path*',
    '/my-servers/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/api/v1/servers/my/:path*'
  ]
}; 