import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '../../../lib/database/repositories/tagRepository';

/**
 * GET /api/tags - 获取标签列表
 */
export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    let tags;
    if (query) {
      // 执行标签搜索
      tags = await tagRepository.search(query, limit);
    } else {
      // 获取所有标签
      tags = await tagRepository.getAll();
    }
    
    // 返回结果
    return NextResponse.json(tags);
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { error: '获取标签列表时出错' },
      { status: 500 }
    );
  }
} 