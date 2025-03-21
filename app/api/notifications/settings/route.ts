import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestSession } from '@/lib/api/auth';
import { notificationService } from '@/lib/api/services/NotificationService';

/**
 * 获取用户通知设置
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

    // 获取用户通知设置
    const settings = await notificationService.getUserSettings(session.userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('获取通知设置失败:', error);
    return NextResponse.json(
      { error: '获取通知设置时出错' },
      { status: 500 }
    );
  }
}

/**
 * 更新用户通知设置
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证用户会话
    const session = await verifyRequestSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取请求体
    const body = await request.json();

    // 验证请求数据
    if (typeof body !== 'object') {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      );
    }

    // 只提取需要的字段
    const updateData: Record<string, any> = {};
    
    if (body.enableAll !== undefined) {
      updateData.enableAll = !!body.enableAll;
    }
    
    if (body.emailEnabled !== undefined) {
      updateData.emailEnabled = !!body.emailEnabled;
    }
    
    if (body.pushEnabled !== undefined) {
      updateData.pushEnabled = !!body.pushEnabled;
    }
    
    if (body.inAppEnabled !== undefined) {
      updateData.inAppEnabled = !!body.inAppEnabled;
    }
    
    if (body.categorySettings && typeof body.categorySettings === 'object') {
      updateData.categorySettings = body.categorySettings;
    }

    // 更新设置
    const updatedSettings = await notificationService.updateUserSettings(
      session.userId,
      updateData
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('更新通知设置失败:', error);
    return NextResponse.json(
      { error: '更新通知设置时出错' },
      { status: 500 }
    );
  }
} 