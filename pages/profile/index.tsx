import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Avatar,
  Button,
  Flex,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Stack,
  useColorModeValue,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Switch,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiEdit2, FiPlus, FiMail, FiGithub, FiTwitter, FiGlobe, FiLock, FiTrash2 } from 'react-icons/fi';
import Layout from '../../components/Layout';
import { Server } from '../../lib/types';

// 模拟数据
const MOCK_USER = {
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

// 模拟已发布的服务器数据
const USER_SERVERS: Server[] = [
  {
    id: 'server-1',
    name: '简单问候服务器',
    description: '基础的问候服务，提供友好的API接口',
    version: '1.0.0',
    downloads: 1240,
    rating: 4.5,
    author: {
      id: 'user1',
      name: '张三',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=1',
    },
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-03-20T00:00:00Z',
    tags: ['入门', '示例', '简单'],
    license: 'MIT',
    tools: [
      {
        id: 'tool-1',
        name: '问候工具',
        description: '提供问候功能',
        version: '1.0.0',
        schema: { type: 'object', properties: {} }
      }
    ],
    publishedVersions: [
      {
        version: '1.0.0',
        publishedAt: '2023-03-20T00:00:00Z',
        changelog: '初始版本发布',
      }
    ],
    requirements: {
      node: '>= 16.0.0',
      memory: '512MB',
      disk: '100MB',
      cpu: '1核',
    }
  },
  {
    id: 'server-2',
    name: '智能回复助手',
    description: '使用AI技术提供智能回复功能的MCP服务器',
    version: '2.1.0',
    downloads: 857,
    rating: 4.8,
    author: {
      id: 'user1',
      name: '张三',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=1',
    },
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
    tags: ['AI', '对话', '助手'],
    license: 'Apache-2.0',
    tools: [
      {
        id: 'tool-2',
        name: 'AI对话工具',
        description: '提供AI对话功能',
        version: '1.2.0',
        schema: { type: 'object', properties: {} }
      }
    ],
    publishedVersions: [
      {
        version: '2.1.0',
        publishedAt: '2023-04-15T00:00:00Z',
        changelog: '优化AI对话效果，提高响应速度',
      },
      {
        version: '2.0.0',
        publishedAt: '2023-03-01T00:00:00Z',
        changelog: '升级AI模型，支持更多对话场景',
      }
    ],
    requirements: {
      node: '>= 18.0.0',
      memory: '1GB',
      disk: '200MB',
      cpu: '2核',
    }
  },
];

// 模拟API使用数据
const API_USAGE = [
  { month: '2023-01', requests: 12480, servers: 1 },
  { month: '2023-02', requests: 15620, servers: 1 },
  { month: '2023-03', requests: 18740, servers: 2 },
  { month: '2023-04', requests: 24350, servers: 2 },
  { month: '2023-05', requests: 28760, servers: 2 },
  { month: '2023-06', requests: 32840, servers: 2 },
];

const ProfilePage = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [userProfile, setUserProfile] = useState(MOCK_USER);
  const [currentSkill, setCurrentSkill] = useState('');
  const [newPassword, setNewPassword] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleAddSkill = () => {
    if (currentSkill.trim() && !userProfile.skills.includes(currentSkill.trim())) {
      setUserProfile(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }));
      setCurrentSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setUserProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSaveProfile = async () => {
    // 模拟API保存操作
    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: '保存成功',
        description: '个人资料已更新',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsEditing(false);
    } catch {
      toast({
        title: '保存失败',
        description: '更新个人资料时出错',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handlePasswordChange = async () => {
    // 验证密码
    if (newPassword.new !== newPassword.confirm) {
      toast({
        title: '密码不匹配',
        description: '新密码与确认密码不一致',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (newPassword.new.length < 8) {
      toast({
        title: '密码太短',
        description: '密码长度至少为8个字符',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // 模拟API密码更新
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: '密码已更新',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 重置表单
      setNewPassword({ current: '', new: '', confirm: '' });
      setShowPassword({ current: false, new: false, confirm: false });
      onClose();
    } catch {
      toast({
        title: '密码更新失败',
        description: '请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Layout title="个人资料 | MCP Cloud">
      <Box mb={8}>
        <Heading mb={2}>个人资料</Heading>
        <Text color="gray.600">管理您的账户信息和服务器</Text>
      </Box>
      
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={currentTab} 
        onChange={setCurrentTab}
        mb={8}
      >
        <TabList>
          <Tab>个人信息</Tab>
          <Tab>我的服务器</Tab>
          <Tab>使用统计</Tab>
          <Tab>安全设置</Tab>
        </TabList>
        
        <TabPanels>
          {/* 个人信息标签页 */}
          <TabPanel>
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ md: 'center' }}
                mb={6}
              >
                <Heading size="md">{isEditing ? '编辑个人资料' : '个人资料'}</Heading>
                
                <Button
                  leftIcon={<FiEdit2 />}
                  onClick={() => setIsEditing(!isEditing)}
                  size="sm"
                  colorScheme={isEditing ? 'gray' : 'blue'}
                >
                  {isEditing ? '取消' : '编辑资料'}
                </Button>
              </Flex>
              
              {isEditing ? (
                // 编辑模式
                <Stack spacing={6}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>姓名</FormLabel>
                      <Input
                        name="name"
                        value={userProfile.name}
                        onChange={handleProfileChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>电子邮件</FormLabel>
                      <Input
                        name="email"
                        value={userProfile.email}
                        onChange={handleProfileChange}
                        type="email"
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>个人简介</FormLabel>
                    <Textarea
                      name="bio"
                      value={userProfile.bio}
                      onChange={handleProfileChange}
                      rows={4}
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>所在地</FormLabel>
                      <Input
                        name="location"
                        value={userProfile.location}
                        onChange={handleProfileChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>个人网站</FormLabel>
                      <Input
                        name="website"
                        value={userProfile.website}
                        onChange={handleProfileChange}
                        placeholder="https://yourdomain.com"
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>GitHub用户名</FormLabel>
                      <Input
                        name="github"
                        value={userProfile.github}
                        onChange={handleProfileChange}
                        placeholder="githubusername"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Twitter用户名</FormLabel>
                      <Input
                        name="twitter"
                        value={userProfile.twitter}
                        onChange={handleProfileChange}
                        placeholder="twitterhandle"
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>技能</FormLabel>
                    <InputGroup>
                      <Input
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        placeholder="添加技能"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      />
                      <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleAddSkill}>
                          添加
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    
                    <Flex wrap="wrap" mt={3} gap={2}>
                      {userProfile.skills.map(skill => (
                        <Tag key={skill} size="md" borderRadius="full" variant="solid" colorScheme="blue">
                          <TagLabel>{skill}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveSkill(skill)} />
                        </Tag>
                      ))}
                    </Flex>
                  </FormControl>
                  
                  <Flex justify="flex-end" mt={4}>
                    <Button
                      colorScheme="blue"
                      onClick={handleSaveProfile}
                    >
                      保存变更
                    </Button>
                  </Flex>
                </Stack>
              ) : (
                // 查看模式
                <Box>
                  <Flex direction={{ base: 'column', md: 'row' }} mb={6}>
                    <Avatar
                      size="xl"
                      name={userProfile.name}
                      src={userProfile.avatarUrl}
                      mr={{ md: 6 }}
                      mb={{ base: 4, md: 0 }}
                    />
                    
                    <Box>
                      <Heading size="lg" mb={1}>{userProfile.name}</Heading>
                      <Text color="gray.600" mb={3}>{userProfile.role}</Text>
                      
                      <HStack spacing={4}>
                        <Badge colorScheme="green">已验证用户</Badge>
                        <Badge colorScheme="purple">开发者</Badge>
                        <Badge>注册于 {new Date(userProfile.createdAt).getFullYear()}</Badge>
                      </HStack>
                    </Box>
                  </Flex>
                  
                  <Box mb={6}>
                    <Heading size="sm" mb={2}>个人简介</Heading>
                    <Text>{userProfile.bio}</Text>
                  </Box>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                    <Box>
                      <Heading size="sm" mb={3}>联系方式</Heading>
                      
                      <Stack spacing={2}>
                        <Flex align="center">
                          <Box as={FiMail} mr={2} color="gray.500" />
                          <Text>{userProfile.email}</Text>
                        </Flex>
                        
                        {userProfile.website && (
                          <Flex align="center">
                            <Box as={FiGlobe} mr={2} color="gray.500" />
                            <Text as="a" href={userProfile.website} target="_blank" color="blue.500">
                              {userProfile.website}
                            </Text>
                          </Flex>
                        )}
                        
                        {userProfile.location && (
                          <Flex align="center">
                            <Box mr={2} color="gray.500">📍</Box>
                            <Text>{userProfile.location}</Text>
                          </Flex>
                        )}
                      </Stack>
                    </Box>
                    
                    <Box>
                      <Heading size="sm" mb={3}>社交账号</Heading>
                      
                      <Stack spacing={2}>
                        {userProfile.github && (
                          <Flex align="center">
                            <Box as={FiGithub} mr={2} color="gray.500" />
                            <Text as="a" href={`https://github.com/${userProfile.github}`} target="_blank" color="blue.500">
                              {userProfile.github}
                            </Text>
                          </Flex>
                        )}
                        
                        {userProfile.twitter && (
                          <Flex align="center">
                            <Box as={FiTwitter} mr={2} color="gray.500" />
                            <Text as="a" href={`https://twitter.com/${userProfile.twitter}`} target="_blank" color="blue.500">
                              @{userProfile.twitter}
                            </Text>
                          </Flex>
                        )}
                      </Stack>
                    </Box>
                  </SimpleGrid>
                  
                  <Box>
                    <Heading size="sm" mb={3}>技能</Heading>
                    <Flex wrap="wrap" gap={2}>
                      {userProfile.skills.map(skill => (
                        <Tag key={skill} size="md" colorScheme="blue">
                          {skill}
                        </Tag>
                      ))}
                    </Flex>
                  </Box>
                </Box>
              )}
            </Box>
          </TabPanel>
          
          {/* 我的服务器标签页 */}
          <TabPanel>
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Flex 
                justify="space-between" 
                align="center"
                mb={6}
              >
                <Heading size="md">我的服务器</Heading>
                <Button
                  as="a"
                  href="/upload"
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  size="sm"
                >
                  上传新服务器
                </Button>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {USER_SERVERS.map(server => (
                  <Box
                    key={server.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                    _hover={{ boxShadow: 'md' }}
                  >
                    <Flex justify="space-between" mb={2}>
                      <Heading size="md" as="a" href={`/servers/${server.id}`} color="blue.500">
                        {server.name}
                      </Heading>
                      <Badge>v{server.version}</Badge>
                    </Flex>
                    
                    <Text noOfLines={2} mb={3} color="gray.600">
                      {server.description}
                    </Text>
                    
                    <SimpleGrid columns={3} mb={3}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">下载量</Text>
                        <Text fontWeight="bold">{server.downloads}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">评分</Text>
                        <Text fontWeight="bold">{server.rating}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">最近更新</Text>
                        <Text fontWeight="bold">{new Date(server.updatedAt).toLocaleDateString('zh-CN')}</Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Flex wrap="wrap" gap={1} mb={3}>
                      {server.tags.map(tag => (
                        <Badge key={tag} colorScheme="blue" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                    
                    <Divider my={3} />
                    
                    <HStack spacing={2}>
                      <Button
                        as="a"
                        href={`/servers/${server.id}/edit`}
                        size="sm"
                        leftIcon={<FiEdit2 />}
                        variant="ghost"
                      >
                        编辑
                      </Button>
                      <Button
                        as="a"
                        href={`/servers/${server.id}`}
                        size="sm"
                        variant="ghost"
                      >
                        查看详情
                      </Button>
                      <IconButton
                        aria-label="删除服务器"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                      />
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </TabPanel>
          
          {/* 使用统计标签页 */}
          <TabPanel>
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Heading size="md" mb={6}>API使用统计</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Box p={4} bg="blue.50" borderRadius="md" _dark={{ bg: 'blue.900' }}>
                  <Text fontWeight="bold" mb={1}>服务器数量</Text>
                  <Heading size="xl">{USER_SERVERS.length}</Heading>
                </Box>
                
                <Box p={4} bg="green.50" borderRadius="md" _dark={{ bg: 'green.900' }}>
                  <Text fontWeight="bold" mb={1}>总下载量</Text>
                  <Heading size="xl">
                    {USER_SERVERS.reduce((sum, server) => sum + server.downloads, 0).toLocaleString()}
                  </Heading>
                </Box>
                
                <Box p={4} bg="purple.50" borderRadius="md" _dark={{ bg: 'purple.900' }}>
                  <Text fontWeight="bold" mb={1}>总API请求量</Text>
                  <Heading size="xl">
                    {API_USAGE.reduce((sum, month) => sum + month.requests, 0).toLocaleString()}
                  </Heading>
                </Box>
              </SimpleGrid>
              
              <Box overflowX="auto">
                <Heading size="sm" mb={3}>月度使用情况</Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>月份</Th>
                      <Th isNumeric>API请求量</Th>
                      <Th isNumeric>活跃服务器数</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {API_USAGE.map(usage => (
                      <Tr key={usage.month}>
                        <Td>{usage.month}</Td>
                        <Td isNumeric>{usage.requests.toLocaleString()}</Td>
                        <Td isNumeric>{usage.servers}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </TabPanel>
          
          {/* 安全设置标签页 */}
          <TabPanel>
            <Box
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
            >
              <Heading size="md" mb={6}>安全设置</Heading>
              
              <Stack spacing={6}>
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">密码</Heading>
                    <Button
                      leftIcon={<FiLock />}
                      colorScheme="blue"
                      size="sm"
                      onClick={onOpen}
                    >
                      修改密码
                    </Button>
                  </Flex>
                  <Text color="gray.600">上次修改：2023年4月1日</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">双因素认证</Heading>
                    <Switch colorScheme="green" />
                  </Flex>
                  <Text color="gray.600">使用验证器应用或短信验证增强账户安全</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">API密钥</Heading>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      variant="outline"
                    >
                      查看API密钥
                    </Button>
                  </Flex>
                  <Text color="gray.600">管理您的API密钥用于程序访问</Text>
                </Box>
              </Stack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* 修改密码弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>修改密码</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>当前密码</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword.current ? 'text' : 'password'}
                    value={newPassword.current}
                    onChange={(e) => setNewPassword({...newPassword, current: e.target.value})}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                    >
                      {showPassword.current ? '隐藏' : '显示'}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>新密码</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    value={newPassword.new}
                    onChange={(e) => setNewPassword({...newPassword, new: e.target.value})}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                    >
                      {showPassword.new ? '隐藏' : '显示'}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>确认新密码</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={newPassword.confirm}
                    onChange={(e) => setNewPassword({...newPassword, confirm: e.target.value})}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                    >
                      {showPassword.confirm ? '隐藏' : '显示'}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handlePasswordChange}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ProfilePage; 