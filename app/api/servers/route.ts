import { NextRequest, NextResponse } from 'next/server';
import { serverRepository } from '../../../lib/database/repositories/serverRepository';

/**
 * GET /api/servers - 获取服务器列表
 */
export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') as 'newest' | 'oldest' | 'downloads' | 'rating' || 'newest';
    
    // 获取标签过滤参数
    const tagParam = searchParams.get('tags');
    const tagIds = tagParam ? tagParam.split(',').map(id => parseInt(id, 10)) : [];
    
    // 根据是否有搜索关键词进行查询
    let result;
    if (query) {
      // 有搜索关键词，执行搜索
      result = await serverRepository.search(query, {
        tagIds,
        sort,
        limit,
        offset,
      });
    } else {
      // 无搜索关键词，获取所有服务器
      result = await serverRepository.getAll(limit, offset);
    }
    
    // 返回结果
    return NextResponse.json({
      items: result.items,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('获取服务器列表失败:', error);
    return NextResponse.json(
      { error: '获取服务器列表时出错' },
      { status: 500 }
    );
  }
} 