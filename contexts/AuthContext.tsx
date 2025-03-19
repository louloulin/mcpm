'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { apiClient, User } from '../lib/api-client';

// 认证上下文状态类型
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件属性
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 在组件挂载时检查用户会话
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (err) {
        // 如果是401错误，这意味着用户未登录，这是正常的
        if (err instanceof Error && err.message.includes('401')) {
          setUser(null);
        } else {
          console.error('加载用户数据时出错:', err);
          setError('无法加载用户数据。请稍后再试。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 登录函数
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { user: userData } = await apiClient.login(username, password);
      setUser(userData);
    } catch (err) {
      console.error('登录失败:', err);
      setError(err instanceof Error ? err.message : '登录失败。请检查您的凭据。');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 注销函数
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      console.error('注销失败:', err);
      setError(err instanceof Error ? err.message : '注销失败。请稍后再试。');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await apiClient.updateUserProfile(userData);
      setUser(updatedUser);
    } catch (err) {
      console.error('更新个人资料失败:', err);
      setError(err instanceof Error ? err.message : '更新资料失败。请稍后再试。');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 提供上下文值
  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
} 