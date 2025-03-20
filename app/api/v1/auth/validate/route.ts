import { NextRequest, NextResponse } from 'next/server';

/**
 * 验证API令牌
 * 检查请求中的令牌是否有效
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求头中获取令牌
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // 在实际应用中，应该验证令牌的有效性，检查其是否在数据库中存在且未过期
    // 这里只是模拟验证，假设令牌格式为 mcpm_api_开头的有效令牌
    
    if (token && token.startsWith('mcpm_api_')) {
      // 返回令牌的模拟信息
      return NextResponse.json({
        valid: true,
        token_info: {
          user_id: 'user-1',
          scopes: ['read:servers', 'write:servers', 'read:users'],
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    } else {
      // 令牌无效
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 