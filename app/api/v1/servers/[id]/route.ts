import { NextRequest, NextResponse } from 'next/server';
import ServerController from '@/lib/api/controllers/ServerController';

// 获取特定服务器
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await ServerController.getById({
      params: { id }
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in server detail route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 更新服务器
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const result = await ServerController.update({
      params: { id },
      body: data,
      user: {} // 默认用户，实际应从认证中获取
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in server update route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 删除服务器
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await ServerController.delete({
      params: { id },
      user: {} // 默认用户，实际应从认证中获取
    } as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: () => ({}),
      send: () => ({}),
    } as any);
    
    return NextResponse.json(result, { status: 204 });
  } catch (error) {
    console.error('Error in server delete route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 