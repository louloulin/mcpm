import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/database';
import { notifications } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 标记所有通知为已读
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.user.id));

    return NextResponse.json({
      success: true,
      count: result.rowCount || 0
    });
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    return NextResponse.json(
      { error: '标记通知时出错' },
      { status: 500 }
    );
  }
} 