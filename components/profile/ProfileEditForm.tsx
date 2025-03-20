"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Globe, Github, Twitter, X, Plus } from "lucide-react"

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

interface ProfileEditFormProps {
  user: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ 
  user, 
  onSave,
  onCancel
}: ProfileEditFormProps) {
  // 表单状态
  const [formData, setFormData] = useState<UserProfile>({...user});
  const [currentSkill, setCurrentSkill] = useState("");
  
  // 处理字段变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理技能添加
  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill("");
    }
  };
  
  // 处理技能添加的键盘事件
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };
  
  // 处理技能移除
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <Avatar className="h-32 w-32 mb-3">
            <AvatarImage src={formData.avatarUrl} alt={formData.name} />
            <AvatarFallback>{formData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <Button variant="outline" type="button" size="sm" className="w-full">
            更换头像
          </Button>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">电子邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>
      </div>
      
      {/* 联系信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">联系信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              所在地
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder="例如：北京，中国"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              个人网站
            </Label>
            <Input
              id="website"
              name="website"
              value={formData.website || ""}
              onChange={handleChange}
              placeholder="例如：https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Label>
            <Input
              id="github"
              name="github"
              value={formData.github || ""}
              onChange={handleChange}
              placeholder="您的 GitHub 用户名"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center">
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Label>
            <Input
              id="twitter"
              name="twitter"
              value={formData.twitter || ""}
              onChange={handleChange}
              placeholder="您的 Twitter 用户名"
            />
          </div>
        </div>
      </div>
      
      {/* 技能标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">技能标签</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1 py-1.5">
              {skill}
              <button 
                type="button" 
                onClick={() => handleRemoveSkill(skill)}
                className="p-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="添加技能标签..."
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddSkill}
            disabled={!currentSkill.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加
          </Button>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存变更
        </Button>
      </DialogFooter>
    </form>
  );
} 