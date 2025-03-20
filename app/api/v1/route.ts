import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'MCPM API',
    version: '1.0.0',
    endpoints: {
      servers: '/api/v1/servers',
      users: '/api/v1/users',
      auth: {
        me: '/api/v1/auth/me'
      },
      stats: '/api/v1/stats',
      sync: '/api/v1/sync'
    }
  });
} 