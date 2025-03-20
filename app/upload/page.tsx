"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const licenses = [
  { value: 'MIT', label: 'MIT License' },
  { value: 'Apache-2.0', label: 'Apache License 2.0' },
  { value: 'GPL-3.0', label: 'GNU General Public License v3.0' },
  { value: 'BSD-3-Clause', label: 'BSD 3-Clause License' },
  { value: 'ISC', label: 'ISC License' },
];

interface Tool {
  id: string;
  name: string;
  description: string;
  schema: string;
}

interface ServerFormData {
  name: string;
  description: string;
  version: string;
  license: string;
  tools: Tool[];
  tags: string[];
  homepage?: string;
  repository?: string;
  requirements: {
    node?: string;
    memory?: string;
    disk?: string;
    cpu?: string;
  };
}

export default function UploadPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    version: '1.0.0',
    license: 'MIT',
    tools: [],
    tags: [],
    requirements: {},
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleRequirementsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [name]: value,
      }
    }));
  };
  
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };
  
  const addTool = () => {
    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      name: '',
      description: '',
      schema: JSON.stringify({
        type: 'object',
        properties: {},
        required: []
      }, null, 2),
    };
    
    setFormData(prev => ({
      ...prev,
      tools: [...prev.tools, newTool],
    }));
  };
  
  const updateTool = (id: string, field: keyof Tool, value: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.map(tool => 
        tool.id === id ? { ...tool, [field]: value } : tool
      ),
    }));
  };
  
  const removeTool = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter(tool => tool.id !== id),
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim()) {
      toast({
        title: '请输入服务器名称',
        variant: 'destructive',
        description: '服务器名称是必填项',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 成功提示
      toast({
        title: '上传成功',
        description: `服务器 ${formData.name} 已成功上传`,
      });
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        license: 'MIT',
        tools: [],
        tags: [],
        requirements: {},
      });
      setAdvancedOptions(false);
    } catch {
      toast({
        title: '上传失败',
        variant: 'destructive',
        description: '服务器上传过程中发生错误，请稍后再试',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container py-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">上传服务器</h1>
        <p className="text-muted-foreground">分享您的MCP服务器到MCP Cloud平台</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>填写服务器的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">服务器名称 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="输入服务器名称"
                  required
                />
                <p className="text-sm text-muted-foreground">服务器的唯一名称</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">版本 <span className="text-red-500">*</span></Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="1.0.0"
                  required
                />
                <p className="text-sm text-muted-foreground">遵循语义化版本规范</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="描述您的服务器功能和特性"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">简要描述服务器的主要功能</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="license">许可证</Label>
              <Select
                value={formData.license}
                onValueChange={(value) => handleSelectChange('license', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择许可证" />
                </SelectTrigger>
                <SelectContent>
                  {licenses.map((license) => (
                    <SelectItem key={license.value} value={license.value}>
                      {license.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="添加标签"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={addTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>高级选项</CardTitle>
              <CardDescription>配置其他可选参数</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-options"
                checked={advancedOptions}
                onCheckedChange={setAdvancedOptions}
              />
              <Label htmlFor="advanced-options">显示高级选项</Label>
            </div>
          </CardHeader>
          
          {advancedOptions && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="homepage">主页</Label>
                  <Input
                    id="homepage"
                    name="homepage"
                    value={formData.homepage || ''}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="repository">代码仓库</Label>
                  <Input
                    id="repository"
                    name="repository"
                    value={formData.repository || ''}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">系统要求</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="node">Node.js 版本</Label>
                    <Input
                      id="node"
                      name="node"
                      value={formData.requirements.node || ''}
                      onChange={handleRequirementsChange}
                      placeholder=">=16.0.0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="memory">内存要求</Label>
                    <Input
                      id="memory"
                      name="memory"
                      value={formData.requirements.memory || ''}
                      onChange={handleRequirementsChange}
                      placeholder="512MB"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disk">磁盘空间</Label>
                    <Input
                      id="disk"
                      name="disk"
                      value={formData.requirements.disk || ''}
                      onChange={handleRequirementsChange}
                      placeholder="1GB"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpu">CPU 要求</Label>
                    <Input
                      id="cpu"
                      name="cpu"
                      value={formData.requirements.cpu || ''}
                      onChange={handleRequirementsChange}
                      placeholder="1 核心"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">工具</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTool}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加工具
                  </Button>
                </div>
                
                {formData.tools.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-md bg-muted/50">
                    <p className="text-muted-foreground">点击添加工具按钮来定义服务器提供的工具</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.tools.map((tool) => (
                      <Card key={tool.id}>
                        <CardHeader className="p-4 flex flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {tool.name || '未命名工具'}
                            </CardTitle>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTool(tool.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`tool-name-${tool.id}`}>名称</Label>
                            <Input
                              id={`tool-name-${tool.id}`}
                              value={tool.name}
                              onChange={(e) => updateTool(tool.id, 'name', e.target.value)}
                              placeholder="工具名称"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`tool-desc-${tool.id}`}>描述</Label>
                            <Textarea
                              id={`tool-desc-${tool.id}`}
                              value={tool.description}
                              onChange={(e) => updateTool(tool.id, 'description', e.target.value)}
                              placeholder="描述该工具的功能"
                              rows={2}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`tool-schema-${tool.id}`}>JSON Schema</Label>
                            <Textarea
                              id={`tool-schema-${tool.id}`}
                              value={tool.schema}
                              onChange={(e) => updateTool(tool.id, 'schema', e.target.value)}
                              placeholder="工具参数的JSON Schema"
                              rows={6}
                              className="font-mono"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                version: '1.0.0',
                license: 'MIT',
                tools: [],
                tags: [],
                requirements: {},
              });
              setAdvancedOptions(false);
            }}
          >
            重置
          </Button>
          <Button 
            type="submit" 
            disabled={isUploading} 
            className="min-w-[120px]"
          >
            {isUploading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                上传中...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                上传服务器
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 