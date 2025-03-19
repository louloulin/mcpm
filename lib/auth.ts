import jwt from 'jsonwebtoken';
import { userRepository } from './database/repositories/userRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * 用户接口
 */
export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

/**
 * 验证JWT令牌
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
 * 生成JWT令牌
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
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
    username: 'unknown',  // 头信息中不包含用户名，使用默认值
    role: userRole,
  };
}

/**
 * 验证用户凭据并返回JWT令牌
 */
export async function authenticateUser(username: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await userRepository.validateCredentials(username, password);
  
  if (!user) {
    return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const token = generateToken(authUser);
  
  return { user: authUser, token };
}

/**
 * 从令牌获取并验证用户
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    // 可选：在这里验证用户是否存在于数据库中
    const user = await userRepository.findById(decoded.id);
    
    if (!user) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
} 