import { db } from '@/lib/database';
import { sessions } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { verify } from 'jsonwebtoken';

/**
 * 会话信息
 */
export interface SessionInfo {
  userId: string;
  sessionId: string;
  expires: Date;
}

/**
 * 验证会话令牌
 * @param token 会话令牌
 * @returns 会话信息或null（如果无效）
 */
export async function verifySessionToken(token: string): Promise<SessionInfo | null> {
  try {
    // 验证JWT签名
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const payload = verify(token, JWT_SECRET) as { sessionId: string };
    
    if (!payload || !payload.sessionId) {
      return null;
    }
    
    // 从数据库获取会话
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, payload.sessionId));
    
    if (!session) {
      return null;
    }
    
    // 检查会话是否过期
    const now = new Date();
    if (session.expiresAt && new Date(session.expiresAt) < now) {
      return null;
    }
    
    return {
      userId: session.userId,
      sessionId: session.id,
      expires: session.expiresAt ? new Date(session.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error('会话令牌验证失败:', error);
    return null;
  }
}

/**
 * 从请求头中获取会话令牌
 * @param headers 请求头
 * @returns 令牌或null
 */
export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // 支持 "Bearer token" 或 "token" 格式
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return authHeader;
}

/**
 * 验证请求中的会话
 * @param headers 请求头
 * @returns 会话信息或null
 */
export async function verifyRequestSession(headers: Headers): Promise<SessionInfo | null> {
  const token = getTokenFromHeaders(headers);
  
  if (!token) {
    return null;
  }
  
  return verifySessionToken(token);
} 