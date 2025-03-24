import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth-edge';
import { db } from '@/lib/database'; 
import { users } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * 用户登录API
 * 验证用户名和密码，返回JWT令牌
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`登录尝试: 邮箱=${email}`);
    
    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'missing_credentials', message: '邮箱和密码不能为空' } },
        { status: 400 }
      );
    }
    
    // 从数据库中查询用户
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
        role: users.role
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // 检查用户是否存在
    if (!userResult || userResult.length === 0) {
      console.log('用户不存在:', email);
      return NextResponse.json(
        { error: { code: 'invalid_credentials', message: '邮箱或密码错误' } },
        { status: 401 }
      );
    }
    
    const user = userResult[0];
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('密码验证失败');
      return NextResponse.json(
        { error: { code: 'invalid_credentials', message: '邮箱或密码错误' } },
        { status: 401 }
      );
    }
    
    console.log('认证成功, 生成令牌...');
    
    // 创建JWT令牌，包含完整的用户信息
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name || 'unknown',
      role: user.role || 'user',
      sub: user.id // 添加标准JWT字段
    }, '24h');
    
    console.log('令牌生成成功:', token.substring(0, 20) + '...');
    
    // 创建响应对象
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
    
    // 更新用户的最后登录时间
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))
      .execute()
      .catch(err => console.error('更新最后登录时间失败:', err));
    
    console.log('Cookie设置完成，返回响应');
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'server_error', message: error.message || 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
} 