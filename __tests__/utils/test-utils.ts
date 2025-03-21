import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

export function createNextRequest(options: Parameters<typeof createMocks>[0] = {}) {
  createMocks(options); // 调用createMocks以保持一致性
  
  // 创建一个基本的URL，用于nextUrl
  const url = new URL(
    options.url || '/',
    'http://localhost:3000'
  );

  // 添加查询参数
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
  }

  // 创建NextRequest
  const nextRequest = new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.headers || {},
  });

  return nextRequest;
} 