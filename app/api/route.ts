import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'MCPM API',
    version: '1.0.0',
    apiVersions: {
      v1: '/api/v1'
    },
    endpoints: {
      servers: '/api/v1/servers',
      health: '/api/health',
      docs: '/api/docs'
    },
    documentation: '/api/docs'
  });
}

export function POST() {
  return NextResponse.json({
    error: 'Method not allowed at root API endpoint',
    status: 405
  }, { status: 405 });
} 