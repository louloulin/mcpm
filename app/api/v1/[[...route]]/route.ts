import { NextRequest, NextResponse } from 'next/server';
import app from '@/lib/server';

// 创建HTTP请求处理器
const http = require('http');
const httpServer = http.createServer(app);

// 模拟Express请求处理
export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
  const url = new URL(request.url);
  const path = params.route ? `/${params.route.join('/')}` : '/';
  
  return handleRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route ? `/${params.route.join('/')}` : '/';
  return handleRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route ? `/${params.route.join('/')}` : '/';
  return handleRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route ? `/${params.route.join('/')}` : '/';
  return handleRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route ? `/${params.route.join('/')}` : '/';
  return handleRequest(request, path);
}

// 通用请求处理函数
async function handleRequest(request: NextRequest, path: string) {
  try {
    const expressResponse = await new Promise((resolve, reject) => {
      // 创建一个模拟的Express请求
      const mockReq = {
        method: request.method,
        url: path,
        headers: Object.fromEntries(request.headers),
        body: request.body ? request.body : undefined,
      };
      
      // 创建一个模拟的Express响应
      const mockRes = {
        statusCode: 200,
        headers: {},
        body: '',
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        set(key: string, value: string) {
          this.headers[key] = value;
          return this;
        },
        send(data: any) {
          this.body = data;
          resolve(this);
        },
        json(data: any) {
          this.body = data;
          this.headers['Content-Type'] = 'application/json';
          resolve(this);
        },
        end() {
          resolve(this);
        }
      };
      
      // 处理请求
      app(mockReq, mockRes);
    });
    
    // 转换为Next.js响应
    const response = expressResponse.body 
      ? typeof expressResponse.body === 'string' 
        ? expressResponse.body
        : JSON.stringify(expressResponse.body)
      : '';
      
    return new NextResponse(response, {
      status: expressResponse.statusCode,
      headers: expressResponse.headers,
    });
  } catch (error) {
    console.error('API路由错误:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 