import { NextResponse } from 'next/server';

/**
 * 获取当前用户信息
 * 如果用户已登录，返回用户详情
 * 如果用户未登录，返回访客状态
 */
export async function GET() {
  try {
    // 在实际应用中，应该从会话或令牌中获取用户信息
    // 这里只是演示，返回模拟的访客信息
    
    const isLoggedIn = false; // 模拟用户未登录状态
    
    if (isLoggedIn) {
      // 如果用户已登录，返回用户信息
      return NextResponse.json({
        status: 'success',
        data: {
          id: 'user-id',
          username: 'username',
          email: 'user@example.com',
          role: 'user',
          isLoggedIn: true
        }
      });
    } else {
      // 如果用户未登录，返回访客状态
      return NextResponse.json({
        status: 'success',
        data: {
          role: 'guest',
          isLoggedIn: false
        }
      });
    }
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to get user information'
      }, 
      { status: 500 }
    );
  }
} 