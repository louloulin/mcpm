import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth-edge';

// 权限类型
export enum Permission {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin'
}

// 权限设置接口
interface PermissionSettings {
  requiredRole: Permission;
  allowPublic?: boolean;
}

/**
 * API权限中间件
 * 用于验证用户是否有权限访问API
 * 
 * @param handler 处理函数
 * @param settings 权限设置
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  settings: PermissionSettings
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 如果允许公共访问，直接调用处理函数
    if (settings.allowPublic) {
      return handler(req, null);
    }

    // 从请求中获取token
    let token = null;
    
    // 1. 从cookie中获取令牌
    const tokenCookie = req.cookies.get('token')?.value;
    const authTokenCookie = req.cookies.get('auth_token')?.value;
    
    // 2. 从Authorization头中获取令牌
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // 使用找到的第一个有效令牌
    token = tokenCookie || authTokenCookie || bearerToken;
    
    // 如果没有令牌，返回未授权错误
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    try {
      // 验证令牌
      const user = await verifyToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      // 检查权限
      const userRole = user.role || 'user';
      
      if (settings.requiredRole === Permission.ADMIN && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin permission required' },
          { status: 403 }
        );
      }

      // 调用处理函数，并传递用户信息
      return handler(req, user);
    } catch (error) {
      console.error('权限验证失败:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * 获取用户ID（如果验证通过）
 */
export function getUserId(req: NextRequest): string | null {
  const userId = req.headers.get('x-user-id');
  return userId;
}

/**
 * 获取用户角色（如果验证通过）
 */
export function getUserRole(req: NextRequest): string | null {
  const userRole = req.headers.get('x-user-role');
  return userRole;
} 