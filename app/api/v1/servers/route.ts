import { NextRequest, NextResponse } from 'next/server';
import ServerController from '@/lib/api/controllers/ServerController';

// 模拟Express控制器调用
export async function GET() {
  try {
    // 调用控制器方法
    const result = await ServerController.getAll({} as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in servers route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 调用控制器方法
    const result = await ServerController.create({
      body: data,
      user: {} // 默认用户，实际应从认证中获取
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in servers route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 