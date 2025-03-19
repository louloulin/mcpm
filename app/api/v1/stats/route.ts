import { NextRequest, NextResponse } from 'next/server';
import StatsController from '@/lib/api/controllers/StatsController';

// 获取统计概览
export async function GET() {
  try {
    const result = await StatsController.getOverview({} as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in stats route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 记录下载
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await StatsController.recordDownload({
      params: { serverId: data.serverId },
      user: data.user,
      ip: data.ip || '0.0.0.0'
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in stats route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 