import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * 创建API令牌
 * 接受名称、过期时间和权限范围，返回一个新的API令牌
 */
export async function POST(request: NextRequest) {
  try {
    // 模拟已验证的会话令牌
    const isAuthenticated = true; // 在实际应用中，应该验证Authorization头中的会话令牌
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, expires_in, scopes } = body;
    
    // 基本验证
    if (!name) {
      return NextResponse.json(
        { error: { code: 'invalid_request', message: 'Token name is required' } },
        { status: 400 }
      );
    }
    
    // 生成API令牌
    const token = `mcpm_api_${crypto.randomBytes(10).toString('hex')}`;
    
    // 计算过期时间
    const expiresInSeconds = expires_in || 30 * 24 * 60 * 60; // 默认30天
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInSeconds * 1000);
    
    // 验证权限范围（实际应用中应检查用户是否有权限请求这些范围）
    const validScopes = scopes || ['read:servers'];
    
    // 返回创建的令牌
    return NextResponse.json({
      token,
      name,
      scopes: validScopes,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Token creation error:', error);
    return NextResponse.json(
      { error: { code: 'server_error', message: error.message || 'Failed to create token' } },
      { status: 500 }
    );
  }
}