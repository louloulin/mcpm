'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, User } from '../lib/api-client';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户信息
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('获取用户信息失败:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 登录方法
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.login(email, password);
      setUser(result.user);
      
      // 确保cookie设置完成
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('登录失败:', err);
      setError(err instanceof Error ? err.message : '登录失败，请稍后再试');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 退出登录方法
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      console.error('退出登录失败:', err);
      setError(err instanceof Error ? err.message : '退出失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户资料方法
  const updateUserProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await apiClient.updateCurrentUser(userData);
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : updatedUser);
    } catch (err) {
      console.error('更新用户资料失败:', err);
      setError(err instanceof Error ? err.message : '更新用户资料失败，请稍后再试');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 