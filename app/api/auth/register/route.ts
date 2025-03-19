import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '../../../../lib/database/repositories/userRepository';

/**
 * POST /api/auth/register - 用户注册
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    const { username, email, password, fullName } = body;

    // 验证请求数据
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: '邮箱不能为空' },
        { status: 400 }
      );
    }

    // 创建用户
    try {
      const user = await userRepository.create({
        username,
        email,
        password,
        fullName,
      });

      // 返回用户信息（不包含密码）
      return NextResponse.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }, { status: 201 });
    } catch (error: any) {
      // 处理特定错误
      if (error.message.includes('用户名已存在')) {
        return NextResponse.json(
          { error: '用户名已被注册' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('邮箱已被注册')) {
        return NextResponse.json(
          { error: '邮箱已被注册' },
          { status: 409 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册过程中发生错误' },
      { status: 500 }
    );
  }
} 