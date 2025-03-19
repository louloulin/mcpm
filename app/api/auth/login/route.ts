import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userRepository } from '../../../../lib/database/repositories/userRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * POST /api/auth/login - 用户登录
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    const { username, password } = body;

    console.log('Login attempt for user:', username);

    // 验证请求数据
    if (!username || !password) {
      console.log('Username or password missing');
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证用户凭据
    try {
      const user = await userRepository.validateCredentials(username, password);
      
      // 如果找不到用户或密码不匹配
      if (!user) {
        console.log('Invalid credentials for user:', username);
        return NextResponse.json(
          { error: '用户名或密码不正确' },
          { status: 401 }
        );
      }
      
      console.log('User found:', user);

      // 生成JWT令牌
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 创建响应
      const response = NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      // 设置Cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24小时
      });

      return response;
    } catch (validationError) {
      console.error('Error during credentials validation:', validationError);
      throw validationError;
    }
  } catch (error) {
    console.error('Login error details:', error);
    return NextResponse.json(
      { error: '登录过程中发生错误' },
      { status: 500 }
    );
  }
} 