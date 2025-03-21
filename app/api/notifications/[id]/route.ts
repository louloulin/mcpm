import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestSession } from '@/lib/api/auth';
import { notificationService } from '@/lib/api/services/NotificationService';

/**
 * 获取单个通知
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const notificationId = params.id;

    // 获取用户的所有通知
    const notifications = await notificationService.getUserNotifications(session.userId);
    
    // 查找特定通知
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return NextResponse.json(
        { error: '通知不存在或无权访问' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { error: '获取通知时出错' },
      { status: 500 }
    );
  }
}

/**
 * 更新通知状态（标记已读）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const { searchParams } = new URL(request.url);
    const markAsRead = searchParams.get('markAsRead') === 'true';

    if (markAsRead) {
      const success = await notificationService.markAsRead(notificationId, session.userId);
      
      if (!success) {
        return NextResponse.json(
          { error: '通知不存在或无权访问' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '通知已标记为已读'
      });
    }

    // 如果不是标记已读，则返回错误
    return NextResponse.json(
      { error: '不支持的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('更新通知失败:', error);
    return NextResponse.json(
      { error: '更新通知时出错' },
      { status: 500 }
    );
  }
}

/**
 * 删除通知
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const success = await notificationService.deleteNotification(notificationId, session.userId);

    if (!success) {
      return NextResponse.json(
        { error: '通知不存在或无权访问' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '通知已删除'
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { error: '删除通知时出错' },
      { status: 500 }
    );
  }
} 