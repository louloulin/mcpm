import { NextResponse } from 'next/server';
import { statsRepository } from '../../../lib/database/repositories/statsRepository';

/**
 * GET /api/stats - 获取统计数据
 */
export async function GET() {
  try {
    // 获取统计数据
    const stats = await statsRepository.getOverview();
    
    // 返回结果
    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据时出错' },
      { status: 500 }
    );
  }
} 