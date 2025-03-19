import { NextRequest, NextResponse } from 'next/server';
import SyncController from '@/lib/api/controllers/SyncController';

// 获取特定同步记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await SyncController.getById({
      params: { id }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync detail route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 