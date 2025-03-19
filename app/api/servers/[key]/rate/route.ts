import { NextRequest, NextResponse } from 'next/server';
import { serverRatingRepository } from '@/lib/database/repositories/serverRatingRepository';
import { serverRepository } from '@/lib/database/repositories/serverRepository';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能评分' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '评分必须是1-5之间的数字' },
        { status: 400 }
      );
    }

    const { key } = params;
    
    // 先通过key获取serverId
    const server = await serverRepository.findByKey(key);
    if (!server) {
      return NextResponse.json(
        { error: '服务器不存在' },
        { status: 404 }
      );
    }

    await serverRatingRepository.rateServer(
      server.id,
      session.user.id,
      rating,
      comment
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rating server:', error);
    return NextResponse.json(
      { error: '评分失败' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const { key } = params;
    
    // 先通过key获取serverId
    const server = await serverRepository.findByKey(key);
    if (!server) {
      return NextResponse.json(
        { error: '服务器不存在' },
        { status: 404 }
      );
    }

    const result = await serverRatingRepository.getServerRatings(
      server.id,
      limit,
      offset
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting server ratings:', error);
    return NextResponse.json(
      { error: '获取评分失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能删除评分' },
        { status: 401 }
      );
    }
    
    const { key } = params;
    
    // 先通过key获取serverId
    const server = await serverRepository.findByKey(key);
    if (!server) {
      return NextResponse.json(
        { error: '服务器不存在' },
        { status: 404 }
      );
    }

    await serverRatingRepository.deleteRating(
      server.id,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: '删除评分失败' },
      { status: 500 }
    );
  }
} 