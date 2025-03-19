'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { Search, Menu, X, User, Settings, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 切换移动菜单
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  // 切换用户菜单
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 导航栏左侧 - Logo和主要导航链接 */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="MCP服务器存储库"
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                  <span className="ml-2 text-xl font-bold text-gray-900">MCPR</span>
                </div>
              </Link>
            </div>
            
            {/* 桌面导航链接 */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/browse" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300">
                浏览
              </Link>
              <Link href="/docs" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300">
                文档
              </Link>
              <Link href="/about" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300">
                关于
              </Link>
            </div>
          </div>
          
          {/* 导航栏右侧 - 搜索和用户 */}
          <div className="flex items-center">
            {/* 搜索按钮 */}
            <Link href="/browse" className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none">
              <Search className="h-5 w-5" />
            </Link>
            
            {/* 用户菜单或登录按钮 */}
            <div className="ml-3 relative">
              {user ? (
                <>
                  {/* 用户头像按钮 */}
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 overflow-hidden">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <span className="ml-2 hidden md:block text-sm text-gray-700">{user.username}</span>
                  </button>
                  
                  {/* 用户下拉菜单 */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-50 border">
                      <Link 
                        href="/dashboard" 
                        className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        个人中心
                      </Link>
                      <Link 
                        href="/dashboard/settings" 
                        className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        设置
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        退出登录
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 hover:border-blue-300 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                  >
                    登录
                  </Link>
                  <Link 
                    href="/register" 
                    className="hidden sm:inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
            
            {/* 移动菜单按钮 */}
            <div className="flex items-center sm:hidden ml-3">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 移动菜单 */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/browse" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              浏览
            </Link>
            <Link 
              href="/docs" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              文档
            </Link>
            <Link 
              href="/about" 
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              关于
            </Link>
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  个人中心
                </Link>
                <Link 
                  href="/dashboard/settings" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  设置
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
          {!user && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4 space-x-3">
                <Link
                  href="/login"
                  className="flex-1 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="flex-1 bg-blue-600 py-2 px-3 border border-transparent rounded-md shadow-sm text-sm leading-4 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 