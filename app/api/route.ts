import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    message: 'MCPR API Server',
    version: '1.0.0',
    documentation: '/docs/api'
  });
}

export function POST() {
  return NextResponse.json({
    error: 'Method not allowed at root API endpoint',
    status: 405
  }, { status: 405 });
} 