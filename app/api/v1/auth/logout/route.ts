import { NextResponse } from 'next/server';

/**
 * 用户登出API
 * 清除认证令牌
 */
export async function POST() {
  try {
    // 创建响应对象
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // 清除token cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'server_error', 
          message: error.message || 'An unexpected error occurred during logout'
        } 
      },
      { status: 500 }
    );
  }
} 