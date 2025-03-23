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
        // 尝试从本地存储获取和验证token
        let hasLocalAuth = false;
        
        if (typeof window !== 'undefined') {
          // 检查cookie
          const cookies = document.cookie.split('; ');
          const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
          const authTokenCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
          
          // 检查localStorage
          const localStorageToken = localStorage.getItem('auth_token');
          
          // 检查sessionStorage
          const sessionStorageToken = sessionStorage.getItem('auth_token');
          
          hasLocalAuth = !!(tokenCookie || authTokenCookie || localStorageToken || sessionStorageToken);
          console.log('本地认证状态检查:', {
            tokenCookie: !!tokenCookie,
            authTokenCookie: !!authTokenCookie,
            localStorageToken: !!localStorageToken,
            sessionStorageToken: !!sessionStorageToken,
            hasLocalAuth
          });
        }
        
        // 如果本地存储中有认证信息，则尝试获取用户信息
        if (hasLocalAuth) {
          try {
            const userData = await apiClient.getCurrentUser();
            console.log('获取到用户数据:', userData);
            setUser(userData);
          } catch (err) {
            console.error('API获取用户信息失败，但存在本地认证:', err);
            // 如果API调用失败但本地有认证信息，创建一个基本用户对象
            setUser({
              id: 'local-user',
              name: 'Authenticated User',
              role: 'user'
            });
          }
        } else {
          // 尝试常规API调用
          const userData = await apiClient.getCurrentUser();
          console.log('获取到用户数据:', userData);
          setUser(userData);
        }
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
      console.log('开始登录流程, 用户名:', email);
      const result = await apiClient.login(email, password);
      console.log('登录成功, 设置用户信息:', result.user);
      setUser(result.user);
      
      // 确保cookie设置完成 - 给服务器更多时间处理cookie
      console.log('等待cookie设置完成...');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('延迟完成，cookie应已设置');
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
      
      // 确保cookie清除完成
      await new Promise(resolve => setTimeout(resolve, 300));
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