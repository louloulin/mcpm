import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * 用户登录API
 * 验证用户名和密码，返回JWT令牌
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // 在实际应用中，应该从数据库中验证用户名和密码
    // 这里只是模拟实现，使用API文档中的示例数据
    
    // 简单的模拟验证
    if (username === 'admin' && password === 'securepassword123') {
      // 创建JWT令牌
      const token = jwt.sign(
        { userId: 'user-1', username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' } // 令牌24小时有效
      );
      
      // 返回令牌和用户信息
      return NextResponse.json({
        token,
        user: {
          id: 'user-1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    } else {
      // 认证失败
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