"use client";

import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

// 引入个人资料组件
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

// 定义用户资料类型，确保和ProfileEditForm组件使用相同的类型
interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  email: string;
  bio: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  createdAt: string;
  skills: string[];
}

// 模拟数据
const MOCK_USER: UserProfile = {
  id: 'user1',
  name: '张三',
  role: 'developer',
  avatarUrl: 'https://i.pravatar.cc/200?u=1',
  email: 'zhangsan@example.com',
  bio: '资深开发者，专注于MCP服务器开发，有5年以上经验，热爱开源社区。',
  location: '上海',
  website: 'https://zhangsan.dev',
  github: 'zhangsan',
  twitter: 'zhangsan_dev',
  createdAt: '2022-01-15T00:00:00Z',
  skills: ['Node.js', 'TypeScript', 'React', 'MCP Protocol', 'API设计'],
};

// 个人资料页面组件
export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 处理修改资料
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // 保存资料变更
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    setIsEditModalOpen(false);
    
    toast({
      title: "个人资料已更新",
      description: "您的个人资料已成功更新",
    });
  };

  // 修改密码
  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  // 确认修改密码
  const handleConfirmPasswordChange = () => {
    // 密码验证
    if (newPassword !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不匹配",
        variant: "destructive",
      });
      return;
    }

    // 这里应该是密码更新的API调用
    // ...

    setIsPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    toast({
      title: "密码已更新",
      description: "您的密码已成功更新",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 个人资料头部 */}
      <ProfileHeader
        user={user}
        onEdit={handleEditProfile}
        onChangePassword={handleChangePassword}
      />

      {/* 个人资料选项卡 */}
      <div className="mt-8">
        <ProfileTabs />
      </div>

      {/* 编辑资料对话框 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
            <DialogDescription>
              更新你的个人信息和资料
            </DialogDescription>
          </DialogHeader>
          
          <ProfileEditForm
            user={user}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              请输入您的当前密码和新密码
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="oldPassword" className="text-right">
                当前密码
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                新密码
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPassword" className="text-right">
                确认密码
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="require2fa" className="text-right">
                启用两步验证
              </Label>
              <div className="flex items-center space-x-2">
                <Switch id="require2fa" />
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmPasswordChange}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 