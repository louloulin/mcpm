import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * 用户接口
 */
export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

/**
 * 验证JWT令牌 - Edge Runtime兼容版本
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    // 验证令牌并解码
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('JWT验证失败:', error);
    return null;
  }
}

/**
 * 从请求头中获取用户信息
 */
export function getUserFromHeaders(headers: Headers): AuthUser | null {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role');

  if (!userId || !userRole) {
    return null;
  }

  return {
    id: userId,
    name: 'unknown',  // 头信息中不包含用户名，使用默认值
    role: userRole,
  };
} 