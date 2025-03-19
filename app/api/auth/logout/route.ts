import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 创建响应
    const response = NextResponse.json({ 
      message: '登出成功'
    });
    
    // 清除令牌cookie
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0), // 立即过期
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Error in logout route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 