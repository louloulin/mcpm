import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// 将密钥转换为Uint8Array格式，这是jose库所需的
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET);
};

/**
 * 用户接口
 */
export interface AuthUser {
  id: string;
  name?: string;
  role: string;
  [key: string]: any; // 允许额外字段
}

/**
 * 从多个来源获取token
 */
export function getTokenFromRequest(request: Request): string | null {
  const headers = new Headers(request.headers);
  
  // 尝试从Authorization头获取
  const authHeader = headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('从Authorization头获取到token:', token.substring(0, 15) + '...');
    return token;
  }
  
  // 从自定义头获取
  const tokenHeader = headers.get('x-auth-token');
  if (tokenHeader) {
    console.log('从x-auth-token头获取到token:', tokenHeader.substring(0, 15) + '...');
    return tokenHeader;
  }
  
  return null;
}

/**
 * 验证JWT令牌 - Edge Runtime兼容版本
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    // 验证令牌并解码
    console.log('开始验证JWT令牌, SECRET:', JWT_SECRET.substring(0, 3) + '...');
    
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256']
    });
    
    console.log('JWT解码成功:', payload);
    
    // 兼容不同格式的token payload
    const user: AuthUser = {
      id: payload.id as string || payload.userId as string || payload.sub as string || 'unknown',
      name: payload.name as string || payload.username as string || payload.userName as string || 'unknown',
      role: payload.role as string || 'user',
      ...Object.fromEntries(
        Object.entries(payload).filter(([key]) => 
          typeof key === 'string' && !key.startsWith('iat') && !key.startsWith('exp') && !key.startsWith('nbf')
        )
      )
    };
    
    console.log('规范化用户数据:', user);
    return user;
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

/**
 * 生成JWT令牌 - Edge Runtime兼容版本
 */
export async function generateToken(payload: Record<string, any>, expiresIn = '24h'): Promise<string> {
  try {
    // 计算过期时间
    const expTime = expiresIn.includes('h') 
      ? parseInt(expiresIn.replace('h', '')) * 60 * 60
      : 24 * 60 * 60; // 默认24小时
    
    // 创建并签名令牌
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expTime)
      .sign(getSecretKey());
    
    return token;
  } catch (error) {
    console.error('JWT生成失败:', error);
    throw error;
  }
} 