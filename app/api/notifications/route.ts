import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyRequestSession } from '@/lib/api/auth';
import { notificationService, NotificationCategory } from '@/lib/api/services/NotificationService';
import { db } from '@/lib/database';
import { notifications } from '@/lib/database/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * 获取用户通知列表
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 从数据库获取用户通知
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    
    // 格式化为前端所需格式
    const formattedNotifications = userNotifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      category: notification.category || '系统通知',
      read: notification.read,
      link: notification.link,
      createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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