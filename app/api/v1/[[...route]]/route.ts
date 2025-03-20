import { NextRequest, NextResponse } from 'next/server';

// 处理 GET 请求
export async function GET(request: NextRequest, { params }: { params: { route?: string[] } }) {
  // 安全地获取路由参数
  const routeParams = Array.isArray(params?.route) ? params.route : [];
  
  // 如果没有路径，返回 API 概览
  if (routeParams.length === 0) {
    return NextResponse.json({
      name: 'MCPM API',
      version: '1.0.0',
      endpoints: [
        '/api/v1/servers',
        '/api/v1/users',
        '/api/v1/stats',
        '/api/health'
      ]
    });
  }
  
  // 路由到专门的路由处理程序
  return NextResponse.json({
    status: 'error',
    message: `Endpoint for ${routeParams.join('/')} is not implemented yet in the new API structure. Please use the dedicated endpoints.`,
    path: `/api/v1/${routeParams.join('/')}`
  }, { status: 404 });
}

// 处理 POST 请求
export async function POST(request: NextRequest, { params }: { params: { route?: string[] } }) {
  // 安全地获取路由参数
  const routeParams = Array.isArray(params?.route) ? params.route : [];
  
  // 如果没有路径，返回方法不允许
  if (routeParams.length === 0) {
    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed at root API endpoint'
    }, { status: 405 });
  }
  
  // 路由到专门的路由处理程序
  return NextResponse.json({
    status: 'error',
    message: `Endpoint for ${routeParams.join('/')} is not implemented yet in the new API structure. Please use the dedicated endpoints.`,
    path: `/api/v1/${routeParams.join('/')}`
  }, { status: 404 });
}

// 处理 PUT 请求
export async function PUT(request: NextRequest, { params }: { params: { route?: string[] } }) {
  // 安全地获取路由参数
  const routeParams = Array.isArray(params?.route) ? params.route : [];
  
  // 路由到专门的路由处理程序
  return NextResponse.json({
    status: 'error',
    message: `Endpoint for ${routeParams.join('/')} is not implemented yet in the new API structure. Please use the dedicated endpoints.`,
    path: `/api/v1/${routeParams.join('/')}`
  }, { status: 404 });
}

// 处理 PATCH 请求
export async function PATCH(request: NextRequest, { params }: { params: { route?: string[] } }) {
  // 安全地获取路由参数
  const routeParams = Array.isArray(params?.route) ? params.route : [];
  
  // 路由到专门的路由处理程序
  return NextResponse.json({
    status: 'error',
    message: `Endpoint for ${routeParams.join('/')} is not implemented yet in the new API structure. Please use the dedicated endpoints.`,
    path: `/api/v1/${routeParams.join('/')}`
  }, { status: 404 });
}

// 处理 DELETE 请求
export async function DELETE(request: NextRequest, { params }: { params: { route?: string[] } }) {
  // 安全地获取路由参数
  const routeParams = Array.isArray(params?.route) ? params.route : [];
  
  // 路由到专门的路由处理程序
  return NextResponse.json({
    status: 'error',
    message: `Endpoint for ${routeParams.join('/')} is not implemented yet in the new API structure. Please use the dedicated endpoints.`,
    path: `/api/v1/${routeParams.join('/')}`
  }, { status: 404 });
} 