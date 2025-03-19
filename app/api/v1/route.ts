import { NextResponse } from 'next/server';

// 使用基于API路由的模式
export function GET() {
  return NextResponse.json({
    message: 'MCPR API Server V1',
    version: '1.0.0',
    endpoints: [
      '/api/v1/servers',
      '/api/v1/users',
      '/api/v1/sync',
      '/api/v1/stats',
      '/api/v1/webhooks'
    ]
  });
} 