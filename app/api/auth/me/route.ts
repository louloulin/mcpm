import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // 从cookie中获取token
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    try {
      // 验证token
      const user = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { id: string; name: string; role: string };
      
      // 返回用户信息（不包含敏感数据）
      return NextResponse.json({
        id: user.id,
        name: user.name,
        role: user.role
      });
    } catch (_jwtError) {
      // token无效或过期
      const response = NextResponse.json(
        { error: '无效或过期的令牌' },
        { status: 401 }
      );
      
      // 清除无效token
      response.cookies.set({
        name: 'token',
        value: '',
        httpOnly: true,
        path: '/',
        expires: new Date(0),
        sameSite: 'strict'
      });
      
      return response;
    }
  } catch (error) {
    console.error('Error in me route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 