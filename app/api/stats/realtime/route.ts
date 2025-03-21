import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { statsWebSocketService } from '@/lib/api/services/StatsWebSocketService';

/**
 * GET /api/stats/realtime - 获取实时统计连接信息
 */
export async function GET() {
  try {
    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    
    // 检查用户是否登录
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能访问实时统计' },
        { status: 401 }
      );
    }

    // 构建WebSocket连接信息
    const protocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
    const host = process.env.NEXT_PUBLIC_API_HOST || 'localhost:3000';
    
    // 从会话中获取JWT令牌
    const token = session.user.id; // 简化处理，实际应该使用JWT令牌

    const connectionInfo = {
      url: `${protocol}://${host}/api/stats/ws?token=${token}`,
      activeConnections: statsWebSocketService.getActiveConnections(),
      availableStats: [
        { type: 'system', description: '系统整体统计' },
        { type: 'developer', description: '开发者个人统计' },
        { type: 'server', description: '特定服务器统计' }
      ],
      instructions: {
        subscribe: { type: 'subscribe', statsType: 'system' },
        unsubscribe: { type: 'unsubscribe', statsType: 'system' },
        ping: { type: 'ping' }
      }
    };
    
    // 返回结果
    return NextResponse.json(connectionInfo);
  } catch (error) {
    console.error('获取实时统计连接信息失败:', error);
    return NextResponse.json(
      { error: '获取实时统计连接信息时出错' },
      { status: 500 }
    );
  }
} 