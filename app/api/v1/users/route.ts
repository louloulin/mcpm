import { NextRequest, NextResponse } from 'next/server';
import UserController from '@/lib/api/controllers/UserController';

// 获取所有用户
export async function GET() {
  try {
    const result = await UserController.getAll({} as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in users route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await UserController.create({
      body: data
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in users route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 