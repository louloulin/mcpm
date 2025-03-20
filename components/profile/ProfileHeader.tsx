"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Mail, Globe, Github, Twitter, Edit, Lock } from "lucide-react"

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

interface ProfileHeaderProps {
  user: UserProfile;
  onEdit: () => void;
  onChangePassword: () => void;
}

export default function ProfileHeader({ user, onEdit, onChangePassword }: ProfileHeaderProps) {
  // 计算注册日期
  const joinDate = new Date(user.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 头像区域 */}
        <div className="flex flex-col items-center md:items-start">
          <Avatar className="h-24 w-24 mb-3">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col space-y-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              编辑资料
            </Button>
            
            <Button variant="outline" size="sm" onClick={onChangePassword} className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              修改密码
            </Button>
          </div>
        </div>
        
        {/* 个人信息区域 */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center mt-1">
                <Badge variant="secondary" className="mr-2">{user.role}</Badge>
                <span className="text-sm text-muted-foreground flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  加入于 {joinDate}
                </span>
              </div>
            </div>
          </div>
          
          {/* 个人简介 */}
          <p className="text-gray-700 dark:text-gray-300 my-3">{user.bio}</p>
          
          {/* 联系信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <span>{user.email}</span>
            </div>
            
            {user.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user.location}</span>
              </div>
            )}
            
            {user.website && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Globe className="h-4 w-4 mr-2" />
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            
            {user.github && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Github className="h-4 w-4 mr-2" />
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {user.github}
                </a>
              </div>
            )}
            
            {user.twitter && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Twitter className="h-4 w-4 mr-2" />
                <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {user.twitter}
                </a>
              </div>
            )}
          </div>
          
          {/* 技能标签 */}
          {user.skills.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">技能</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 