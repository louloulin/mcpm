import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth-edge';

/**
 * 用户登录API
 * 验证用户名和密码，返回JWT令牌
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    console.log(`登录尝试: 用户名=${username}`);
    
    // 在实际应用中，应该从数据库中验证用户名和密码
    // 这里只是模拟实现，使用API文档中的示例数据
    
    // 简单的模拟验证
    if (username === 'admin' && password === 'securepassword123') {
      console.log('认证成功, 生成令牌...');
      
      // 创建JWT令牌，使用Edge兼容的generateToken
      const token = await generateToken({
        id: 'user-1',
        name: 'admin',
        role: 'admin',
        sub: 'user-1'  // 添加标准JWT字段
      }, '24h');
      
      console.log('令牌生成成功:', token.substring(0, 20) + '...');
      
      // 创建响应对象
      const response = NextResponse.json({
        token,
        user: {
          id: 'user-1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      // 设置token cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24小时
        path: '/'
      });
      
      // 设置另一个非httpOnly cookie，便于前端访问
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24小时
        path: '/'
      });
      
      console.log('Cookie设置完成，返回响应');
      return response;
    } else {
      // 认证失败
      console.log('认证失败: 无效的用户名或密码');
      return NextResponse.json(
        { error: { code: 'invalid_credentials', message: 'Invalid username or password' } },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'server_error', message: error.message || 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
} 