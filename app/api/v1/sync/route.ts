import { NextResponse } from 'next/server';
import SyncController from '@/lib/api/controllers/SyncController';

// 获取所有同步记录
export async function GET() {
  try {
    const result = await SyncController.getAll({} as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 触发同步
export async function POST() {
  try {
    const result = await SyncController.triggerSync({
      body: {},
      user: { role: 'admin' } // 假设是管理员触发
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 