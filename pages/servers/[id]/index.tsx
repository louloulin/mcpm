import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Link,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Code,
  Tag,
} from '@chakra-ui/react';
import { FiDownload, FiStar, FiGithub, FiHome, FiTool, FiCalendar, FiPackage } from 'react-icons/fi';
import Layout from '../../../components/Layout';
import ServerApiDocs from '../../../components/ServerApiDocs';
import { Server, Tool, VersionInfo } from '../../../lib/types';

// 用于测试的模拟数据，实际应用中应该从API获取
const MOCK_SERVERS: Server[] = [
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

const ServerDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [server, setServer] = useState<Server | null>(null);
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
      <Layout title="加载中... | MCP Cloud">
        <Flex justify="center" align="center" minH="500px" direction="column">
          <Spinner size="xl" mb={4} />
          <Text>加载服务器详情...</Text>
        </Flex>
      </Layout>
    );
  }
  
  if (error || !server) {
    return (
      <Layout title="错误 | MCP Cloud">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error || '发生错误'}
        </Alert>
        <Button mt={4} onClick={() => router.push('/servers')}>
          返回服务器列表
        </Button>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${server.name} | MCP Cloud`}>
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
          {server.tags.map(tag => (
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
              {new Date(server.updatedAt).toLocaleDateString('zh-CN')}
            </StatHelpText>
          </Stat>
          
          <Stat bg={statsColor} p={3} borderRadius="md">
            <Flex align="center">
              <Icon as={FiPackage} mr={2} />
              <StatLabel>当前版本</StatLabel>
            </Flex>
            <StatNumber>{server.version}</StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>
      
      {/* 服务器详细信息标签页 */}
      <Box
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
        overflow="hidden"
      >
        <Tabs 
          variant="enclosed" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={setActiveTab}
          p={4}
        >
          <TabList>
            <Tab>概览</Tab>
            <Tab>API文档</Tab>
            <Tab>工具</Tab>
            <Tab>安装指南</Tab>
            <Tab>版本历史</Tab>
          </TabList>
          
          <TabPanels>
            {/* 概览标签页 */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box gridColumn={{ md: 'span 2' }}>
                  <Heading size="md" mb={4}>关于服务器</Heading>
                  <Box mb={6}>
                    <Text>{server.description}</Text>
                  </Box>
                  
                  <Heading size="md" mb={4}>系统要求</Heading>
                  <Table variant="simple" size="sm" mb={6}>
                    <Tbody>
                      {server.requirements?.node && (
                        <Tr>
                          <Td fontWeight="bold" width="120px">Node.js</Td>
                          <Td>{server.requirements.node}</Td>
                        </Tr>
                      )}
                      {server.requirements?.memory && (
                        <Tr>
                          <Td fontWeight="bold">内存</Td>
                          <Td>{server.requirements.memory}</Td>
                        </Tr>
                      )}
                      {server.requirements?.disk && (
                        <Tr>
                          <Td fontWeight="bold">磁盘空间</Td>
                          <Td>{server.requirements.disk}</Td>
                        </Tr>
                      )}
                      {server.requirements?.cpu && (
                        <Tr>
                          <Td fontWeight="bold">CPU</Td>
                          <Td>{server.requirements.cpu}</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                  
                  <Heading size="md" mb={4}>许可证</Heading>
                  <Text mb={6}>
                    {server.license}
                  </Text>
                  
                  {server.tools && server.tools.length > 0 && (
                    <>
                      <Heading size="md" mb={4}>提供的工具</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                        {server.tools.map(tool => (
                          <Box
                            key={tool.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={borderColor}
                          >
                            <Flex align="center" mb={2}>
                              <Icon as={FiTool} mr={2} />
                              <Heading size="sm">{tool.name}</Heading>
                            </Flex>
                            <Text fontSize="sm">{tool.description}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </>
                  )}
                </Box>
                
                <Box>
                  <Heading size="md" mb={4}>作者信息</Heading>
                  <Flex align="center" mb={6}>
                    <Avatar
                      size="md"
                      name={server.author?.name}
                      src={server.author?.avatarUrl}
                      mr={3}
                    />
                    <Box>
                      <Text fontWeight="bold">{server.author?.name}</Text>
                      <Text fontSize="sm">{server.author?.role}</Text>
                    </Box>
                  </Flex>
                  
                  <Heading size="md" mb={4}>链接</Heading>
                  <Stack spacing={2} mb={6}>
                    {server.homepage && (
                      <Flex align="center">
                        <Icon as={FiHome} mr={2} />
                        <Link href={server.homepage} isExternal color="blue.500">
                          项目主页
                        </Link>
                      </Flex>
                    )}
                    {server.repository && (
                      <Flex align="center">
                        <Icon as={FiGithub} mr={2} />
                        <Link href={server.repository} isExternal color="blue.500">
                          代码仓库
                        </Link>
                      </Flex>
                    )}
                  </Stack>
                  
                  <Heading size="md" mb={4}>快速安装</Heading>
                  <Box bg="gray.100" p={3} borderRadius="md" mb={4} fontFamily="mono" fontSize="sm" _dark={{ bg: 'gray.700' }}>
                    <Code display="block" whiteSpace="pre" overflowX="auto">
                      {`npm install @mcp/cli -g\nmcp install ${server.id}`}
                    </Code>
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>
            
            {/* API文档标签页 */}
            <TabPanel>
              <ServerApiDocs server={server} />
            </TabPanel>
            
            {/* 工具标签页 */}
            <TabPanel>
              <Heading size="md" mb={6}>工具列表</Heading>
              
              {(!server.tools || server.tools.length === 0) ? (
                <Alert status="info">
                  <AlertIcon />
                  此服务器未提供任何工具
                </Alert>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {server.tools.map((tool: Tool) => (
                    <Box 
                      key={tool.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={borderColor}
                    >
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">{tool.name}</Heading>
                        <Tag size="sm" colorScheme="blue">v{tool.version}</Tag>
                      </Flex>
                      
                      <Text mb={4}>{tool.description}</Text>
                      
                      <Divider mb={4} />
                      
                      <Heading size="sm" mb={2}>Schema</Heading>
                      <Box bg="gray.50" p={3} borderRadius="md" maxH="200px" overflowY="auto" _dark={{ bg: 'gray.700' }}>
                        <Code display="block" whiteSpace="pre" overflowX="auto">
                          {JSON.stringify(tool.schema, null, 2)}
                        </Code>
                      </Box>
                      
                      <Button mt={4} size="sm" colorScheme="blue" variant="outline">
                        测试工具
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            {/* 安装指南标签页 */}
            <TabPanel>
              <Heading size="md" mb={6}>安装指南</Heading>
              
              <Box mb={8}>
                <Heading size="sm" mb={3}>前置条件</Heading>
                <Text mb={4}>确保您已经安装了：</Text>
                <Box as="ul" pl={6} mb={4}>
                  <Box as="li" mb={2}>Node.js {server.requirements?.node}</Box>
                  <Box as="li" mb={2}>MCP CLI工具</Box>
                </Box>
                
                <Box bg="gray.50" p={3} borderRadius="md" mb={6} _dark={{ bg: 'gray.700' }}>
                  <Code display="block" whiteSpace="pre" overflowX="auto">
                    {`# 安装MCP CLI工具
npm install @mcp/cli -g`}
                  </Code>
                </Box>
              </Box>
              
              <Box mb={8}>
                <Heading size="sm" mb={3}>使用MCP CLI安装</Heading>
                <Text mb={4}>使用以下命令安装服务器：</Text>
                
                <Box bg="gray.50" p={3} borderRadius="md" mb={4} _dark={{ bg: 'gray.700' }}>
                  <Code display="block" whiteSpace="pre" overflowX="auto">
                    {`# 安装服务器
mcp install ${server.id}

# 或指定版本安装
mcp install ${server.id}@${server.version}`}
                  </Code>
                </Box>
                
                <Text mb={4}>安装完成后，您可以使用以下命令启动服务器：</Text>
                
                <Box bg="gray.50" p={3} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                  <Code display="block" whiteSpace="pre" overflowX="auto">
                    {`# 启动服务器
cd ${server.id}
npm start`}
                  </Code>
                </Box>
              </Box>
              
              <Box mb={8}>
                <Heading size="sm" mb={3}>手动安装</Heading>
                <Text mb={4}>您也可以通过npm手动安装：</Text>
                
                <Box bg="gray.50" p={3} borderRadius="md" mb={4} _dark={{ bg: 'gray.700' }}>
                  <Code display="block" whiteSpace="pre" overflowX="auto">
                    {`# 创建目录
mkdir ${server.id} && cd ${server.id}

# 初始化项目
npm init -y

# 安装服务器包
npm install @mcp/servers/${server.id}

# 创建入口文件
echo "const server = require('@mcp/servers/${server.id}');" > index.js
echo "server.start();" >> index.js

# 启动服务器
node index.js`}
                  </Code>
                </Box>
              </Box>
              
              <Box>
                <Heading size="sm" mb={3}>配置</Heading>
                <Text mb={4}>您可以通过创建配置文件来自定义服务器设置：</Text>
                
                <Box bg="gray.50" p={3} borderRadius="md" _dark={{ bg: 'gray.700' }}>
                  <Code display="block" whiteSpace="pre" overflowX="auto">
                    {`// config.js
module.exports = {
  port: 3000,
  logLevel: 'info',
  // 其他配置项...
};

// 使用配置启动
const server = require('@mcp/servers/${server.id}');
const config = require('./config');
server.start(config);`}
                  </Code>
                </Box>
              </Box>
            </TabPanel>
            
            {/* 版本历史标签页 */}
            <TabPanel>
              <Heading size="md" mb={6}>版本历史</Heading>
              
              {(!server.publishedVersions || server.publishedVersions.length === 0) ? (
                <Alert status="info">
                  <AlertIcon />
                  无版本历史记录
                </Alert>
              ) : (
                <Box>
                  {server.publishedVersions.map((version: VersionInfo, index: number) => (
                    <Box
                      key={version.version}
                      mb={index < server.publishedVersions!.length - 1 ? 6 : 0}
                    >
                      <Flex align="center" mb={2}>
                        <Heading size="md" mr={2}>v{version.version}</Heading>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(version.publishedAt).toLocaleDateString('zh-CN')}
                        </Text>
                      </Flex>
                      
                      {version.changelog && (
                        <Text mb={4}>{version.changelog}</Text>
                      )}
                      
                      <HStack spacing={4}>
                        <Button size="sm" variant="outline">下载此版本</Button>
                        <Button size="sm" variant="ghost">查看更多</Button>
                      </HStack>
                      
                      {index < server.publishedVersions!.length - 1 && (
                        <Divider mt={4} />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Layout>
  );
};

export default ServerDetailPage; 