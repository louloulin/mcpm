import { NextRequest, NextResponse } from 'next/server';
import SyncController from '@/lib/api/controllers/SyncController';

// 获取最新同步记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || undefined;
    
    const result = await SyncController.getLatest({
      query: { source }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in latest sync route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 