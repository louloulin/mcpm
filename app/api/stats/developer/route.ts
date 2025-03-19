import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { statsRepository } from '@/lib/database/repositories/statsRepository';

/**
 * GET /api/stats/developer - 获取当前登录开发者的统计数据
 */
export async function GET() {
  try {
    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    
    // 检查用户是否登录
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能访问开发者统计' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const userId = session.user.id;
    
    // 获取开发者统计数据
    const stats = await statsRepository.getDeveloperStats(userId);
    
    // 返回结果
    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取开发者统计数据失败:', error);
    return NextResponse.json(
      { error: '获取开发者统计数据时出错' },
      { status: 500 }
    );
  }
} 