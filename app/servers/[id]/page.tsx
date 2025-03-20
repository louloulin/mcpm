"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Flex,
  Icon,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Tbody,
  Tr,
  Td,
  HStack,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Code,
  Container,
} from '@chakra-ui/react';
import { FiDownload, FiStar, FiGithub, FiHome, FiTool, FiCalendar, FiPackage } from 'react-icons/fi';

// 用于测试的模拟数据，实际应用中应该从API获取
const MOCK_SERVERS = [
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
      id: 'user2',
      name: '李四',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=2',
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

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const id = use(params as Promise<{ id: string }>).id;
  const router = useRouter();
  
  const [server, setServer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statsColor = useColorModeValue('blue.50', 'blue.900');
  
  useEffect(() => {
    const fetchServer = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 从模拟数据中查找服务器
        const foundServer = MOCK_SERVERS.find(s => s.id === id);
        
        if (foundServer) {
          setServer(foundServer);
        } else {
          setError('找不到服务器');
        }
      } catch (err) {
        console.error('获取服务器详情失败:', err);
        setError('加载服务器详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServer();
  }, [id]);
  
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="500px" direction="column">
          <Spinner size="xl" mb={4} />
          <Text>加载服务器详情...</Text>
        </Flex>
      </Container>
    );
  }
  
  if (error || !server) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error || '发生错误'}
        </Alert>
        <Button mt={4} onClick={() => router.push('/servers')}>
          返回服务器列表
        </Button>
      </Container>
    );
  }
  
  // 格式化日期
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
      {/* 服务器头部信息 */}
      <Box mb={8}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} mb={4}>
          <Box mb={{ base: 4, md: 0 }}>
            <Heading size="lg">{server.name}</Heading>
            <Text fontSize="md" color="gray.600">
              {server.description}
            </Text>
          </Box>
          
          <HStack spacing={4}>
            <Button colorScheme="blue" leftIcon={<FiDownload />}>
              安装服务器
            </Button>
            <Button colorScheme="blue" variant="outline">
              在线测试
            </Button>
          </HStack>
        </Flex>
        
        <Flex wrap="wrap" gap={2} mb={6}>
          {server.tags.map((tag: string) => (
            <Badge key={tag} colorScheme="blue">
              {tag}
            </Badge>
          ))}
        </Flex>
        
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={8}>
          <Stat bg={statsColor} p={3} borderRadius="md">
            <Flex align="center">
              <Icon as={FiDownload} mr={2} />
              <StatLabel>下载量</StatLabel>
            </Flex>
            <StatNumber>{server.downloads.toLocaleString()}</StatNumber>
          </Stat>
          
          <Stat bg={statsColor} p={3} borderRadius="md">
            <Flex align="center">
              <Icon as={FiStar} mr={2} />
              <StatLabel>评分</StatLabel>
            </Flex>
            <StatNumber>{server.rating.toFixed(1)}</StatNumber>
          </Stat>
          
          <Stat bg={statsColor} p={3} borderRadius="md">
            <Flex align="center">
              <Icon as={FiCalendar} mr={2} />
              <StatLabel>更新日期</StatLabel>
            </Flex>
            <StatHelpText mb={0}>
              {formatDate(server.updatedAt)}
            </StatHelpText>
          </Stat>
          
          <Stat bg={statsColor} p={3} borderRadius="md">
            <Flex align="center">
              <Icon as={FiPackage} mr={2} />
              <StatLabel>版本</StatLabel>
            </Flex>
            <StatHelpText mb={0}>
              v{server.version} ({server.license})
            </StatHelpText>
          </Stat>
        </SimpleGrid>
      </Box>
      
      {/* 详细信息选项卡 */}
      <Tabs colorScheme="blue" variant="enclosed" index={activeTab} onChange={setActiveTab}>
        <TabList mb={4}>
          <Tab>概览</Tab>
          <Tab>工具</Tab>
          <Tab>API文档</Tab>
          <Tab>版本历史</Tab>
        </TabList>
        
        <TabPanels>
          {/* 概览 */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box 
                p={5} 
                borderWidth="1px" 
                borderRadius="md"
                bg={bgColor}
                borderColor={borderColor}
              >
                <Heading size="md" mb={4}>系统要求</Heading>
                <Table variant="simple">
                  <Tbody>
                    <Tr>
                      <Td fontWeight="bold" px={0}>Node.js</Td>
                      <Td>{server.requirements.node}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold" px={0}>内存</Td>
                      <Td>{server.requirements.memory}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold" px={0}>磁盘空间</Td>
                      <Td>{server.requirements.disk}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold" px={0}>CPU</Td>
                      <Td>{server.requirements.cpu}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
              
              <Box 
                p={5} 
                borderWidth="1px" 
                borderRadius="md"
                bg={bgColor}
                borderColor={borderColor}
              >
                <Heading size="md" mb={4}>作者信息</Heading>
                <Flex align="center" mb={4}>
                  <Avatar 
                    src={server.author.avatarUrl} 
                    name={server.author.name} 
                    size="md" 
                    mr={3} 
                  />
                  <Box>
                    <Text fontWeight="bold">{server.author.name}</Text>
                    <Badge>{server.author.role}</Badge>
                  </Box>
                </Flex>
                <Divider mb={4} />
                <HStack spacing={4}>
                  <Button variant="outline" size="sm" leftIcon={<FiGithub />}>
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<FiHome />}>
                    个人主页
                  </Button>
                </HStack>
              </Box>
            </SimpleGrid>
            
            <Box 
              mt={8}
              p={5} 
              borderWidth="1px" 
              borderRadius="md"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>安装指南</Heading>
              <Text mb={4}>
                使用MCP CLI工具安装此服务器:
              </Text>
              <Box bg="gray.50" p={3} borderRadius="md" mb={6} _dark={{ bg: 'gray.700' }}>
                <Code display="block" colorScheme="gray">
                  mcp install {server.name}
                </Code>
              </Box>
              
              <Text mb={4}>
                或者使用npm安装:
              </Text>
              <Box bg="gray.50" p={3} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                <Code display="block" colorScheme="gray">
                  npm install @mcp/{server.id}
                </Code>
              </Box>
            </Box>
          </TabPanel>
          
          {/* 工具 */}
          <TabPanel p={0}>
            <Box 
              p={5} 
              borderWidth="1px" 
              borderRadius="md"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>服务器工具</Heading>
              
              {server.tools.length > 0 ? (
                <Stack spacing={6} divider={<Divider />}>
                  {server.tools.map((tool: any) => (
                    <Box key={tool.id}>
                      <Flex align="center" mb={2}>
                        <Icon as={FiTool} mr={2} color="blue.500" />
                        <Heading size="sm">{tool.name}</Heading>
                        <Badge ml={2} colorScheme="blue">v{tool.version}</Badge>
                      </Flex>
                      <Text mb={4}>{tool.description}</Text>
                      
                      <Heading size="xs" mb={2}>Schema</Heading>
                      <Box bg="gray.50" p={3} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                        <Code display="block" colorScheme="gray">
                          {JSON.stringify(tool.schema, null, 2)}
                        </Code>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Text>此服务器没有提供工具</Text>
              )}
            </Box>
          </TabPanel>
          
          {/* API文档 */}
          <TabPanel p={0}>
            <Box 
              p={5} 
              borderWidth="1px" 
              borderRadius="md"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>API参考文档</Heading>
              
              <Heading size="sm" mb={3}>REST API端点</Heading>
              <Box bg="gray.50" p={3} borderRadius="md" mb={6} _dark={{ bg: 'gray.700' }}>
                <Code display="block" whiteSpace="pre" overflowX="auto" colorScheme="gray">
{`// 获取服务器信息
GET /api/{server.id}

// 调用工具
POST /api/${server.id}/tools/:toolId
Content-Type: application/json

{
  "inputs": {
    // 工具所需的输入参数
  }
}`}
                </Code>
              </Box>
              
              <Heading size="sm" mb={3}>JavaScript示例</Heading>
              <Box bg="gray.50" p={3} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                <Code display="block" whiteSpace="pre" overflowX="auto" colorScheme="gray">
{`// 安装依赖
// npm install @mcp/client

// 导入客户端
import { createMCPClient } from '@mcp/client';

// 创建客户端实例
const client = createMCPClient();

// 连接服务器
const server = await client.connect('${server.id}');

// 调用工具
const result = await server.invoke('${server.tools[0]?.id || 'toolId'}', {
  // 工具所需的输入参数
});

console.log(result);`}
                </Code>
              </Box>
            </Box>
          </TabPanel>
          
          {/* 版本历史 */}
          <TabPanel p={0}>
            <Box 
              p={5} 
              borderWidth="1px" 
              borderRadius="md"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>版本历史</Heading>
              
              <Stack spacing={6} divider={<Divider />}>
                {server.publishedVersions.map((version: any) => (
                  <Box key={version.version}>
                    <Flex align="center" mb={2}>
                      <Badge colorScheme="green" mr={2}>v{version.version}</Badge>
                      <Text fontSize="sm" color="gray.500">
                        发布于 {formatDate(version.publishedAt)}
                      </Text>
                    </Flex>
                    <Text>{version.changelog}</Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 