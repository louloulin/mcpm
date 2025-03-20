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
  Icon,
} from '@chakra-ui/react';
import { FiUpload, FiPlus, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';

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

const UploadPage = () => {
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
    <Layout title="上传服务器 | MCP Cloud">
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
              placeholder="描述服务器的功能和用途"
              rows={3}
            />
            <FormHelperText>简明扼要的描述服务器的功能</FormHelperText>
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
          
          <FormControl>
            <FormLabel>标签</FormLabel>
            <InputGroup>
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="添加标签"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={addTag}>
                  添加
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormHelperText>添加关键字标签，按Enter或点击添加按钮</FormHelperText>
            
            <Flex wrap="wrap" mt={2} gap={2}>
              {formData.tags.map(tag => (
                <Tag key={tag} size="md" borderRadius="full" variant="solid" colorScheme="blue">
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeTag(tag)} />
                </Tag>
              ))}
            </Flex>
          </FormControl>
          
          <Divider />
          
          {/* 工具部分 */}
          <Flex justify="space-between" align="center">
            <Heading size="md">服务器工具</Heading>
            <Button leftIcon={<FiPlus />} size="sm" onClick={addTool}>
              添加工具
            </Button>
          </Flex>
          
          {formData.tools.length === 0 ? (
            <Text color="gray.500">没有定义工具。点击&ldquo;添加工具&rdquo;按钮创建新工具。</Text>
          ) : (
            formData.tools.map(tool => (
              <Box
                key={tool.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
                position="relative"
              >
                <IconButton
                  icon={<FiX />}
                  size="sm"
                  aria-label="删除工具"
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => removeTool(tool.id)}
                />
                
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>工具名称</FormLabel>
                    <Input
                      value={tool.name}
                      onChange={(e) => updateTool(tool.id, 'name', e.target.value)}
                      placeholder="工具名称"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>描述</FormLabel>
                    <Input
                      value={tool.description}
                      onChange={(e) => updateTool(tool.id, 'description', e.target.value)}
                      placeholder="工具描述"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Schema</FormLabel>
                    <Textarea
                      value={tool.schema}
                      onChange={(e) => updateTool(tool.id, 'schema', e.target.value)}
                      placeholder="工具的JSON Schema定义"
                      rows={6}
                      fontFamily="mono"
                      fontSize="sm"
                    />
                    <FormHelperText>JSON格式的工具参数定义</FormHelperText>
                  </FormControl>
                </Stack>
              </Box>
            ))
          )}
          
          <Divider />
          
          {/* 高级设置 */}
          <Flex justify="space-between" align="center">
            <Heading size="md">高级设置</Heading>
            <Switch
              isChecked={advancedOptions}
              onChange={(e) => setAdvancedOptions(e.target.checked)}
              colorScheme="blue"
            />
          </Flex>
          
          {advancedOptions && (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>项目主页</FormLabel>
                  <Input
                    name="homepage"
                    value={formData.homepage || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/your-project"
                  />
                  <FormHelperText>服务器项目的官方网站URL</FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>代码仓库</FormLabel>
                  <Input
                    name="repository"
                    value={formData.repository || ''}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repo"
                  />
                  <FormHelperText>服务器源码的仓库URL</FormHelperText>
                </FormControl>
              </SimpleGrid>
              
              <Heading size="sm" mt={2}>系统要求</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>Node.js版本</FormLabel>
                  <Input
                    name="node"
                    value={formData.requirements.node || ''}
                    onChange={handleRequirementsChange}
                    placeholder=">= 14.0.0"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>内存</FormLabel>
                  <Input
                    name="memory"
                    value={formData.requirements.memory || ''}
                    onChange={handleRequirementsChange}
                    placeholder="512MB"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>磁盘空间</FormLabel>
                  <Input
                    name="disk"
                    value={formData.requirements.disk || ''}
                    onChange={handleRequirementsChange}
                    placeholder="100MB"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>CPU</FormLabel>
                  <Input
                    name="cpu"
                    value={formData.requirements.cpu || ''}
                    onChange={handleRequirementsChange}
                    placeholder="1核"
                  />
                </FormControl>
              </SimpleGrid>
            </>
          )}
          
          <Divider />
          
          {/* 上传文件部分 */}
          <FormControl>
            <FormLabel>上传服务器包</FormLabel>
            <Box
              border="2px dashed"
              borderColor={borderColor}
              borderRadius="md"
              p={6}
              textAlign="center"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              onClick={() => document.getElementById('server-file')?.click()}
            >
              <Input
                id="server-file"
                type="file"
                accept=".tgz,.zip,.tar.gz"
                hidden
              />
              <Flex direction="column" align="center" justify="center">
                <Icon as={FiUpload} boxSize={10} color="blue.500" mb={3} />
                <Heading size="sm" mb={2}>拖放文件或点击上传</Heading>
                <Text fontSize="sm" color="gray.500">
                  支持 .tgz, .zip, .tar.gz 格式的服务器包
                </Text>
              </Flex>
            </Box>
            <FormHelperText>上传打包好的服务器文件，最大支持50MB</FormHelperText>
          </FormControl>
          
          <HStack spacing={4} mt={4}>
            <Button
              type="submit"
              colorScheme="blue"
              leftIcon={<FiUpload />}
              isLoading={isUploading}
              loadingText="正在上传"
              size="lg"
            >
              上传服务器
            </Button>
            
            <Button
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
          </HStack>
        </Stack>
      </Box>
    </Layout>
  );
};

export default UploadPage; 