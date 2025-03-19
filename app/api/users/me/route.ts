import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeaders } from '../../../../lib/auth';
import { userRepository } from '../../../../lib/database/repositories/userRepository';

/**
 * GET /api/users/me - 获取当前登录用户信息
 */
export async function GET(req: NextRequest) {
  try {
    // 从请求头获取用户ID
    const authUser = getUserFromHeaders(req.headers);
    
    if (!authUser) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    // 从数据库获取完整的用户信息
    const user = await userRepository.findById(authUser.id);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 返回用户信息（不包含密码）
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      website: user.website,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息时出错' },
      { status: 500 }
    );
  }
} 