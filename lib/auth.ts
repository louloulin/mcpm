import jwt from 'jsonwebtoken';

// 用户数据结构
export interface User {
  id: string;
  username: string;
  role?: string;
}

/**
 * 验证JWT令牌
 * @param token JWT令牌
 * @returns 包含验证结果和用户信息的对象
 */
export async function verifyAuth(token: string): Promise<{ isValid: boolean; user?: User }> {
  try {
    // 验证Token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as User;
    
    // 确保用户ID和用户名存在
    if (!decoded || !decoded.id || !decoded.username) {
      return { isValid: false };
    }
    
    // 返回验证成功和用户信息
    return { 
      isValid: true, 
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role || 'user'
      } 
    };
  } catch (_error) {
    // 验证失败
    return { isValid: false };
  }
}

/**
 * 生成JWT令牌
 * @param user 用户信息
 * @returns JWT令牌
 */
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
}

/**
 * 从请求头获取用户信息
 * @param headers 请求头
 * @returns 用户信息
 */
export function getUserFromHeaders(headers: Headers): User | null {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role') || 'user';
  
  if (!userId) {
    return null;
  }
  
  return {
    id: userId,
    username: '',  // 请求头中可能没有用户名
    role: userRole
  };
} 