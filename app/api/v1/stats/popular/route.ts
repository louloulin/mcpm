import { NextRequest, NextResponse } from 'next/server';
import StatsController from '@/lib/api/controllers/StatsController';

// 获取热门服务器
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    
    const result = await StatsController.getPopularServers({
      query: { limit }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in popular servers route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 