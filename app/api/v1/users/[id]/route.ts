import { NextRequest, NextResponse } from 'next/server';
import UserController from '@/lib/api/controllers/UserController';

// 获取特定用户
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await UserController.getById({
      params: { id }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in user detail route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const result = await UserController.update({
      params: { id },
      body: data,
      user: {} // 默认用户，实际应从认证中获取
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in user update route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await UserController.delete({
      params: { id },
      user: {} // 默认用户，实际应从认证中获取
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: () => ({}),
      send: () => ({}),
    } as any);
    
    return NextResponse.json(result, { status: 204 });
  } catch (error) {
    console.error('Error in user delete route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 