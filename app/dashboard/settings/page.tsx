'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { 
  Save, 
  User, 
  Mail, 
  Key, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Globe
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    avatarUrl: '',
    website: '',
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // 如果用户未登录且认证加载完成，重定向到登录页
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/settings');
    }
    
    // 如果用户已登录，填充表单数据
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        website: user.website || '',
      });
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(formData);
      setMessage({ type: 'success', text: '个人资料已成功更新' });
    } catch (error) {
      console.error('更新个人资料失败:', error);
      setMessage({ type: 'error', text: '更新个人资料失败，请稍后再试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordMessage(null);

    // 验证密码
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '新密码与确认密码不匹配' });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: '新密码必须至少包含8个字符' });
      setIsLoading(false);
      return;
    }

    try {
      // 这里应该调用API来更新密码
      await apiClient.updatePassword(currentPassword, newPassword);
      
      // 重置密码字段
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setPasswordMessage({ type: 'success', text: '密码已成功更新' });
    } catch (error) {
      console.error('更新密码失败:', error);
      setPasswordMessage({ type: 'error', text: '更新密码失败，请检查当前密码是否正确' });
    } finally {
      setIsLoading(false);
    }
  };

  // 如果认证正在加载，显示加载状态
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果用户未登录，显示空页面（会被重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            账户设置
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您的个人资料、密码和安全设置
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <User className="mr-2 h-5 w-5 text-gray-400" />
            个人资料
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            更新您的个人信息和公开资料
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">用户名创建后无法更改</p>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  电子邮件
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  全名
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  个人简介
                </label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  简短介绍您自己，将显示在您的公开资料中
                </p>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
                  头像URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="avatarUrl"
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  个人网站
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {message && (
              <div className={`mt-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className={`h-5 w-5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      正在保存...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Key className="mr-2 h-5 w-5 text-gray-400" />
            修改密码
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            确保您的密码足够强大且定期更换
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  当前密码
                </label>
                <div className="mt-1">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  新密码
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  密码必须至少包含8个字符
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  确认新密码
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {passwordMessage && (
              <div className={`mt-6 p-4 rounded-md ${passwordMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className={`h-5 w-5 ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {passwordMessage.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      正在更新...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      更新密码
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-gray-400" />
            安全设置
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            管理您账户的安全选项
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="twoFactor"
                  name="twoFactor"
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="twoFactor" className="font-medium text-gray-700">
                  启用双因素认证 (2FA)
                </label>
                <p className="text-gray-500">
                  为您的账户添加额外的安全层
                </p>
              </div>
            </div>
            
            <div>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => alert('此功能尚未实现')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                管理API密钥
              </button>
              <p className="mt-1 text-sm text-gray-500">
                创建和管理API密钥以通过程序访问仓库
              </p>
            </div>
            
            <div>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                注销账户
              </button>
              <p className="mt-1 text-sm text-gray-500">
                永久删除您的账户和所有相关数据。此操作不可撤销。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 