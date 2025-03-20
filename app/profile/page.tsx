"use client";

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
  Container,
} from '@chakra-ui/react';
import { FiEdit2, FiPlus, FiMail, FiGithub, FiTwitter, FiGlobe, FiLock, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

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
const USER_SERVERS = [
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

export default function ProfilePage() {
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
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: '密码修改成功',
        description: '您的密码已成功更新',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 重置表单
      setNewPassword({ current: '', new: '', confirm: '' });
      onClose();
    } catch {
      toast({
        title: '修改失败',
        description: '修改密码时发生错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // 格式化日期函数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* 个人资料部分 */}
      <Box
        mb={8}
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'flex-start' }}
        >
          <Avatar
            size="2xl"
            name={userProfile.name}
            src={userProfile.avatarUrl}
            mb={{ base: 4, md: 0 }}
            mr={{ md: 6 }}
          />
          
          <Box flex="1">
            <Flex
              justify="space-between"
              align="center"
              mb={4}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Box mb={{ base: 2, sm: 0 }}>
                <Heading as="h1" size="xl" mb={1}>{userProfile.name}</Heading>
                <Flex align="center">
                  <Badge colorScheme="blue" mr={2}>{userProfile.role}</Badge>
                  <Text color="gray.500">加入于 {formatDate(userProfile.createdAt)}</Text>
                </Flex>
              </Box>
              
              {!isEditing ? (
                <Button
                  leftIcon={<FiEdit2 />}
                  onClick={() => setIsEditing(true)}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                >
                  编辑资料
                </Button>
              ) : (
                <HStack>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    colorScheme="blue"
                    size="sm"
                  >
                    保存
                  </Button>
                </HStack>
              )}
            </Flex>
            
            {!isEditing ? (
              <>
                <Text mb={4} whiteSpace="pre-wrap">{userProfile.bio}</Text>
                
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
                  <Flex align="center">
                    <Box as={FiMail} mr={2} color="gray.500" />
                    <Text>{userProfile.email}</Text>
                  </Flex>
                  {userProfile.location && (
                    <Flex align="center">
                      <Box as="span" mr={2} color="gray.500">📍</Box>
                      <Text>{userProfile.location}</Text>
                    </Flex>
                  )}
                  {userProfile.website && (
                    <Flex align="center">
                      <Box as={FiGlobe} mr={2} color="gray.500" />
                      <Text>{userProfile.website}</Text>
                    </Flex>
                  )}
                  {userProfile.github && (
                    <Flex align="center">
                      <Box as={FiGithub} mr={2} color="gray.500" />
                      <Text>{userProfile.github}</Text>
                    </Flex>
                  )}
                  {userProfile.twitter && (
                    <Flex align="center">
                      <Box as={FiTwitter} mr={2} color="gray.500" />
                      <Text>{userProfile.twitter}</Text>
                    </Flex>
                  )}
                </SimpleGrid>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>技能</Text>
                  <Flex flexWrap="wrap">
                    {userProfile.skills.map(skill => (
                      <Tag key={skill} m={1} colorScheme="teal">
                        <TagLabel>{skill}</TagLabel>
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </>
            ) : (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>简介</FormLabel>
                  <Textarea
                    name="bio"
                    value={userProfile.bio}
                    onChange={handleProfileChange}
                    rows={4}
                  />
                </FormControl>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>电子邮件</FormLabel>
                    <Input
                      name="email"
                      value={userProfile.email}
                      onChange={handleProfileChange}
                    />
                  </FormControl>
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
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>GitHub</FormLabel>
                    <Input
                      name="github"
                      value={userProfile.github}
                      onChange={handleProfileChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Twitter</FormLabel>
                    <Input
                      name="twitter"
                      value={userProfile.twitter}
                      onChange={handleProfileChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>技能</FormLabel>
                    <InputGroup>
                      <Input
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        placeholder="添加技能"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="添加技能"
                          icon={<FiPlus />}
                          size="sm"
                          onClick={handleAddSkill}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>当前技能</Text>
                  <Flex flexWrap="wrap">
                    {userProfile.skills.map(skill => (
                      <Tag key={skill} m={1} colorScheme="teal">
                        <TagLabel>{skill}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveSkill(skill)} />
                      </Tag>
                    ))}
                  </Flex>
                </Box>
                
                <Flex justify="space-between">
                  <Button
                    leftIcon={<FiLock />}
                    onClick={onOpen}
                    variant="outline"
                    colorScheme="purple"
                  >
                    修改密码
                  </Button>
                </Flex>
              </Stack>
            )}
          </Box>
        </Flex>
      </Box>
      
      {/* 选项卡内容 */}
      <Tabs
        isLazy
        colorScheme="blue"
        variant="enclosed"
        index={currentTab}
        onChange={index => setCurrentTab(index)}
      >
        <TabList>
          <Tab>我的服务器</Tab>
          <Tab>API用量</Tab>
          <Tab>账户设置</Tab>
        </TabList>
        
        <TabPanels>
          {/* 我的服务器 */}
          <TabPanel p={0} mt={4}>
            <Box
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>我发布的服务器</Heading>
              
              {USER_SERVERS.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>名称</Th>
                      <Th>版本</Th>
                      <Th>下载量</Th>
                      <Th>评分</Th>
                      <Th>最后更新</Th>
                      <Th width="120px">操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {USER_SERVERS.map(server => (
                      <Tr key={server.id}>
                        <Td fontWeight="medium">{server.name}</Td>
                        <Td>{server.version}</Td>
                        <Td>{server.downloads.toLocaleString()}</Td>
                        <Td>{server.rating}</Td>
                        <Td>{formatDate(server.updatedAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="编辑服务器"
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                            />
                            <IconButton
                              aria-label="删除服务器"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Box textAlign="center" py={8}>
                  <Text fontSize="lg" color="gray.500">您还没有发布任何服务器</Text>
                  <Button
                    mt={4}
                    colorScheme="blue"
                    leftIcon={<FiPlus />}
                  >
                    上传服务器
                  </Button>
                </Box>
              )}
            </Box>
          </TabPanel>
          
          {/* API用量 */}
          <TabPanel p={0} mt={4}>
            <Box
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>API调用统计</Heading>
              
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>月份</Th>
                    <Th>请求数</Th>
                    <Th>活跃服务器</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {API_USAGE.map(item => (
                    <Tr key={item.month}>
                      <Td>{item.month}</Td>
                      <Td>{item.requests.toLocaleString()}</Td>
                      <Td>{item.servers}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          {/* 账户设置 */}
          <TabPanel p={0} mt={4}>
            <Box
              p={6}
              borderRadius="lg"
              boxShadow="sm"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>账户设置</Heading>
              
              <Stack spacing={6}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="email-alerts" mb="0">
                    接收电子邮件通知
                  </FormLabel>
                  <Switch id="email-alerts" defaultChecked />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="two-factor" mb="0">
                    启用两因素认证
                  </FormLabel>
                  <Switch id="two-factor" />
                </FormControl>
                
                <Divider />
                
                <Stack spacing={4}>
                  <Heading size="sm">账户安全</Heading>
                  <Button
                    leftIcon={<FiLock />}
                    onClick={onOpen}
                    variant="outline"
                    colorScheme="purple"
                    width="fit-content"
                  >
                    修改密码
                  </Button>
                </Stack>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={4} color="red.500">危险操作</Heading>
                  <Button
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    variant="outline"
                  >
                    注销账户
                  </Button>
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
                    onChange={(e) => setNewPassword({ ...newPassword, current: e.target.value })}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="显示密码"
                      icon={showPassword.current ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>新密码</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    value={newPassword.new}
                    onChange={(e) => setNewPassword({ ...newPassword, new: e.target.value })}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="显示密码"
                      icon={showPassword.new ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>确认新密码</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={newPassword.confirm}
                    onChange={(e) => setNewPassword({ ...newPassword, confirm: e.target.value })}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="显示密码"
                      icon={showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handlePasswordChange}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 