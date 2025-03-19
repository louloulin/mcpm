import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // 验证用户凭据 (实际应从UserController获取)
    // 这里是一个简化的示例
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }
    
    // 在实际应用中，应该验证用户名和密码
    const user = { id: '1', username, role: 'user' };
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // 设置cookie (HttpOnly提高安全性)
    const response = NextResponse.json({ 
      message: '登录成功',
      user: { id: user.id, username: user.username, role: user.role }
    });
    
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1天
      sameSite: 'strict'
    });
    
    return response;
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 