import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestSession } from '@/lib/api/auth';
import { notificationService, NotificationCategory } from '@/lib/api/services/NotificationService';

/**
 * 获取用户通知列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 从查询参数获取过滤器
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const categoryParam = searchParams.get('category');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // 获取用户通知
    const notifications = await notificationService.getUserNotifications(
      session.userId,
      { 
        unreadOnly, 
        category: categoryParam ? categoryParam as NotificationCategory : undefined, 
        limit, 
        offset 
      }
    );

    // 获取未读通知总数
    const unreadCount = (await notificationService.getUserNotifications(
      session.userId,
      { unreadOnly: true }
    )).length;

    return NextResponse.json({
      notifications,
      count: notifications.length,
      unreadCount,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { error: '获取通知时出错' },
      { status: 500 }
    );
  }
}

/**
 * 创建新通知（仅系统使用）
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();

    // 验证API密钥（仅系统内部API使用）
    const apiKey = request.headers.get('x-api-key');
    const systemApiKey = process.env.SYSTEM_API_KEY;
    
    if (!apiKey || apiKey !== systemApiKey) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 验证请求数据
    if (!body.userId || !body.title || !body.message || !body.type || !body.category) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 创建通知
    const notificationId = await notificationService.createNotification({
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type,
      category: body.category,
      link: body.link,
      metadata: body.metadata,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return NextResponse.json({
      success: true,
      notificationId,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json(
      { error: '创建通知时出错' },
      { status: 500 }
    );
  }
}

/**
 * 标记所有通知为已读
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 从查询参数获取过滤器
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as NotificationCategory | null;

    // 标记所有通知为已读
    const count = await notificationService.markAllAsRead(
      session.userId,
      category || undefined
    );

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    return NextResponse.json(
      { error: '标记通知时出错' },
      { status: 500 }
    );
  }
}

/**
 * 删除所有通知（通常由系统清理任务执行）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户会话或API密钥
    const session = await verifyRequestSession(request.headers);
    const apiKey = request.headers.get('x-api-key');
    const systemApiKey = process.env.SYSTEM_API_KEY;
    
    if (!session && (!apiKey || apiKey !== systemApiKey)) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 如果是系统API调用，可能是清理过期通知
    if (apiKey === systemApiKey) {
      const count = await notificationService.cleanupExpiredNotifications();
      return NextResponse.json({
        success: true,
        count,
        operation: '清理过期通知'
      });
    }

    // 用户删除自己的所有通知逻辑可以在这里添加
    // 目前我们不支持用户一次性删除所有通知
    return NextResponse.json(
      { error: '操作不支持' },
      { status: 400 }
    );
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { error: '删除通知时出错' },
      { status: 500 }
    );
  }
} 