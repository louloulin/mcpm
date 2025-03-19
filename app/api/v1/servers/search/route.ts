import { NextRequest, NextResponse } from 'next/server';
import ServerController from '@/lib/api/controllers/ServerController';

// 搜索服务器
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : undefined;
    
    if (!q) {
      return NextResponse.json(
        { error: '搜索查询不能为空' },
        { status: 400 }
      );
    }
    
    const result = await ServerController.search({
      query: { q, limit, offset }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in servers search route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 