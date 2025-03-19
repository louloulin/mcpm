import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '../../../../lib/database/repositories/tagRepository';

/**
 * GET /api/tags/popular - 获取热门标签
 */
export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // 获取热门标签
    const tags = await tagRepository.getPopular(limit);
    
    // 返回结果
    return NextResponse.json(tags);
  } catch (error) {
    console.error('获取热门标签失败:', error);
    return NextResponse.json(
      { error: '获取热门标签时出错' },
      { status: 500 }
    );
  }
} 