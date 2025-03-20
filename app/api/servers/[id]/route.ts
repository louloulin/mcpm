import { NextRequest, NextResponse } from 'next/server';
import { serverRepository } from '../../../../lib/database/repositories/serverRepository';

/**
 * GET /api/servers/[id] - 获取服务器详情
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 查找服务器
    const server = await serverRepository.findByKey(id);
    
    // 如果找不到服务器
    if (!server) {
      return NextResponse.json(
        { error: '服务器不存在' },
        { status: 404 }
      );
    }
    
    // 增加下载计数（异步执行，不等待结果）
    serverRepository.incrementDownloads(server.id).catch(error => {
      console.error('增加下载计数失败:', error);
    });
    
    // 返回服务器详情
    return NextResponse.json(server);
  } catch (error) {
    console.error('获取服务器详情失败:', error);
    return NextResponse.json(
      { error: '获取服务器详情时出错' },
      { status: 500 }
    );
  }
} 