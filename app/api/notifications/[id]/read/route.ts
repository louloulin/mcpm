import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { notifications } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json(
        { error: '通知ID不能为空' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 确保通知属于当前用户
    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      ),
    });

    if (!notification) {
      return NextResponse.json(
        { error: '通知不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 已经标记为已读
    if (notification.read) {
      return NextResponse.json({
        success: true,
        already_read: true
      });
    }

    // 标记为已读
    await db.update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      );

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    return NextResponse.json(
      { error: '标记通知时出错' },
      { status: 500 }
    );
  }
} 