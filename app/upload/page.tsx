"use client";

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  FormHelperText,
  Stack,
  SimpleGrid,
  useToast,
  Flex,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  Divider,
  Switch,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  Container,
} from '@chakra-ui/react';
import { FiUpload, FiPlus, FiX } from 'react-icons/fi';

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
  const toast = useToast();
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleRequirementsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        status: 'error',
        duration: 3000,
        isClosable: true,
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
        status: 'success',
        duration: 5000,
        isClosable: true,
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
        description: '服务器上传过程中发生错误，请稍后再试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Container maxW="container.xl" pt={8}>
      <Box mb={8}>
        <Heading mb={2}>上传服务器</Heading>
        <Text color="gray.600">分享您的MCP服务器到MCP Cloud平台</Text>
      </Box>
      
      <Box
        as="form"
        onSubmit={handleSubmit}
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <Stack spacing={6}>
          {/* 基本信息 */}
          <Heading size="md">基本信息</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl isRequired>
              <FormLabel>服务器名称</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="输入服务器名称"
              />
              <FormHelperText>服务器的唯一名称</FormHelperText>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>版本</FormLabel>
              <Input
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0.0"
              />
              <FormHelperText>遵循语义化版本规范</FormHelperText>
            </FormControl>
          </SimpleGrid>
          
          <FormControl isRequired>
            <FormLabel>描述</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="描述您的服务器功能和用途"
              rows={4}
            />
            <FormHelperText>简要描述服务器的功能、特点和使用场景</FormHelperText>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>许可证</FormLabel>
            <Select
              name="license"
              value={formData.license}
              onChange={handleChange}
            >
              {licenses.map(license => (
                <option key={license.value} value={license.value}>
                  {license.label}
                </option>
              ))}
            </Select>
            <FormHelperText>选择适合您服务器的开源许可证</FormHelperText>
          </FormControl>
          
          {/* 标签 */}
          <FormControl>
            <FormLabel>标签</FormLabel>
            <InputGroup>
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="添加标签"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <InputRightElement>
                <IconButton
                  aria-label="添加标签"
                  icon={<FiPlus />}
                  size="sm"
                  onClick={addTag}
                />
              </InputRightElement>
            </InputGroup>
            <FormHelperText>添加关键词以帮助用户找到您的服务器</FormHelperText>
            
            {formData.tags.length > 0 && (
              <HStack mt={3} flexWrap="wrap" spacing={2}>
                {formData.tags.map(tag => (
                  <Tag
                    key={tag}
                    size="md"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="blue"
                    my={1}
                  >
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => removeTag(tag)} />
                  </Tag>
                ))}
              </HStack>
            )}
          </FormControl>
          
          {/* 工具 */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">工具</Heading>
              <Button
                leftIcon={<FiPlus />}
                size="sm"
                onClick={addTool}
                variant="outline"
              >
                添加工具
              </Button>
            </Flex>
            
            {formData.tools.map((tool, index) => (
              <Box
                key={tool.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                mb={4}
                position="relative"
              >
                <IconButton
                  aria-label="删除工具"
                  icon={<FiX />}
                  size="sm"
                  position="absolute"
                  right={2}
                  top={2}
                  onClick={() => removeTool(tool.id)}
                />
                
                <Heading size="sm" mb={4}>工具 #{index + 1}</Heading>
                
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>工具名称</FormLabel>
                    <Input
                      value={tool.name}
                      onChange={(e) => updateTool(tool.id, 'name', e.target.value)}
                      placeholder="输入工具名称"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>描述</FormLabel>
                    <Textarea
                      value={tool.description}
                      onChange={(e) => updateTool(tool.id, 'description', e.target.value)}
                      placeholder="描述工具的功能和用途"
                      rows={2}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Schema</FormLabel>
                    <Textarea
                      value={tool.schema}
                      onChange={(e) => updateTool(tool.id, 'schema', e.target.value)}
                      placeholder="输入JSON Schema"
                      rows={6}
                      fontFamily="mono"
                    />
                    <FormHelperText>使用JSON Schema格式定义工具的参数</FormHelperText>
                  </FormControl>
                </Stack>
              </Box>
            ))}
            
            {formData.tools.length === 0 && (
              <Text color="gray.500" textAlign="center" py={4}>
                还没有添加工具，点击上方按钮添加
              </Text>
            )}
          </Box>
          
          {/* 高级选项 */}
          <Box>
            <Flex justify="space-between" align="center" mb={4} mt={2}>
              <Heading size="md">高级选项</Heading>
              <Switch
                isChecked={advancedOptions}
                onChange={() => setAdvancedOptions(!advancedOptions)}
              />
            </Flex>
            
            {advancedOptions && (
              <Stack spacing={6}>
                <Divider />
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>主页</FormLabel>
                    <Input
                      name="homepage"
                      value={formData.homepage || ''}
                      onChange={handleChange}
                      placeholder="https://yourdomain.com"
                    />
                    <FormHelperText>您服务器的官方网站</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>代码仓库</FormLabel>
                    <Input
                      name="repository"
                      value={formData.repository || ''}
                      onChange={handleChange}
                      placeholder="https://github.com/username/repo"
                    />
                    <FormHelperText>源代码仓库地址</FormHelperText>
                  </FormControl>
                </SimpleGrid>
                
                <Heading size="sm" mb={2}>系统要求</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Node.js 版本</FormLabel>
                    <Input
                      name="node"
                      value={formData.requirements.node || ''}
                      onChange={handleRequirementsChange}
                      placeholder=">=14"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>内存</FormLabel>
                    <Input
                      name="memory"
                      value={formData.requirements.memory || ''}
                      onChange={handleRequirementsChange}
                      placeholder=">=512MB"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>磁盘空间</FormLabel>
                    <Input
                      name="disk"
                      value={formData.requirements.disk || ''}
                      onChange={handleRequirementsChange}
                      placeholder=">=1GB"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>CPU</FormLabel>
                    <Input
                      name="cpu"
                      value={formData.requirements.cpu || ''}
                      onChange={handleRequirementsChange}
                      placeholder=">=1 core"
                    />
                  </FormControl>
                </SimpleGrid>
              </Stack>
            )}
          </Box>
          
          <Divider />
          
          <Flex justify="flex-end">
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              isLoading={isUploading}
              loadingText="上传中..."
              leftIcon={<FiUpload />}
            >
              上传服务器
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Container>
  );
} 