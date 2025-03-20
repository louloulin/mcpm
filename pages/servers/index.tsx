import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Select,
  Stack,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiServer, FiDownload, FiStar } from 'react-icons/fi';
import Layout from '../../components/Layout';
import { Server } from '../../lib/types';

// 模拟服务器数据
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
  {
    id: 'server-3',
    name: '数据分析引擎',
    description: '强大的数据处理和分析功能，支持多种数据格式',
    version: '1.5.0',
    downloads: 632,
    rating: 4.2,
    author: {
      id: 'user3',
      name: '王五',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=3',
    },
    createdAt: '2023-03-05T00:00:00Z',
    updatedAt: '2023-05-10T00:00:00Z',
    tags: ['数据', '分析', '高级'],
    license: 'BSD-3-Clause',
    tools: [
      {
        id: 'tool-3',
        name: '数据分析工具',
        description: '提供数据分析功能',
        version: '1.3.0',
        schema: { type: 'object', properties: {} }
      },
      {
        id: 'tool-4',
        name: '数据可视化工具',
        description: '提供数据可视化功能',
        version: '1.1.0',
        schema: { type: 'object', properties: {} }
      }
    ],
    publishedVersions: [
      {
        version: '1.5.0',
        publishedAt: '2023-05-10T00:00:00Z',
        changelog: '新增JSON和CSV数据导出功能',
      },
      {
        version: '1.4.0',
        publishedAt: '2023-04-02T00:00:00Z',
        changelog: '优化数据处理性能，支持更大规模数据集',
      }
    ],
    requirements: {
      node: '>= 16.0.0',
      memory: '2GB',
      disk: '500MB',
      cpu: '4核',
    }
  },
  {
    id: 'server-4',
    name: '文件存储服务',
    description: '安全可靠的文件存储服务，支持多种存储策略',
    version: '1.2.0',
    downloads: 485,
    rating: 4.0,
    author: {
      id: 'user4',
      name: '赵六',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=4',
    },
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2023-04-25T00:00:00Z',
    tags: ['存储', '文件', '云'],
    license: 'MIT',
    tools: [
      {
        id: 'tool-5',
        name: '文件上传工具',
        description: '提供文件上传功能',
        version: '1.0.0',
        schema: { type: 'object', properties: {} }
      }
    ],
    publishedVersions: [
      {
        version: '1.2.0',
        publishedAt: '2023-04-25T00:00:00Z',
        changelog: '新增加密存储功能',
      }
    ],
    requirements: {
      node: '>= 14.0.0',
      memory: '512MB',
      disk: '1GB',
      cpu: '1核',
    }
  },
  {
    id: 'server-5',
    name: '图像处理服务',
    description: '全面的图像处理服务，支持多种图像处理操作',
    version: '2.0.0',
    downloads: 723,
    rating: 4.6,
    author: {
      id: 'user5',
      name: '孙七',
      role: 'developer',
      avatarUrl: 'https://i.pravatar.cc/100?u=5',
    },
    createdAt: '2023-02-15T00:00:00Z',
    updatedAt: '2023-05-05T00:00:00Z',
    tags: ['图像', '处理', '媒体'],
    license: 'MIT',
    tools: [
      {
        id: 'tool-6',
        name: '图像转换工具',
        description: '提供图像格式转换功能',
        version: '1.1.0',
        schema: { type: 'object', properties: {} }
      },
      {
        id: 'tool-7',
        name: '图像滤镜工具',
        description: '提供图像滤镜效果',
        version: '1.0.0',
        schema: { type: 'object', properties: {} }
      }
    ],
    publishedVersions: [
      {
        version: '2.0.0',
        publishedAt: '2023-05-05T00:00:00Z',
        changelog: '全新架构，提高处理速度和稳定性',
      },
      {
        version: '1.5.0',
        publishedAt: '2023-03-10T00:00:00Z',
        changelog: '新增批量处理功能',
      }
    ],
    requirements: {
      node: '>= 16.0.0',
      memory: '1GB',
      disk: '500MB',
      cpu: '2核',
    }
  },
];

type SortOption = 'downloads' | 'rating' | 'newest' | 'name';

const ServerListPage = () => {
  const router = useRouter();
  const { search, tag } = router.query;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 从路由参数初始化搜索和标签
  useEffect(() => {
    if (search && typeof search === 'string') {
      setSearchQuery(search);
    }
    
    if (tag) {
      const tags = Array.isArray(tag) ? tag : [tag];
      setSelectedTags(tags as string[]);
    }
  }, [search, tag]);
  
  // 获取服务器数据
  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用模拟数据
        let filteredServers = [...MOCK_SERVERS];
        
        // 应用搜索过滤
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredServers = filteredServers.filter(server => 
            server.name.toLowerCase().includes(query) || 
            server.description.toLowerCase().includes(query) || 
            server.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        // 应用标签过滤
        if (selectedTags.length > 0) {
          filteredServers = filteredServers.filter(server => 
            selectedTags.every(tag => server.tags.includes(tag))
          );
        }
        
        // 应用排序
        filteredServers.sort((a, b) => {
          switch (sortBy) {
            case 'downloads':
              return b.downloads - a.downloads;
            case 'rating':
              return b.rating - a.rating;
            case 'newest':
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });
        
        setServers(filteredServers);
      } catch (err) {
        console.error('获取服务器列表失败:', err);
        setError('无法加载服务器列表，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServers();
  }, [searchQuery, selectedTags, sortBy]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({
      pathname: '/servers',
      query: { 
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(selectedTags.length > 0 ? { tag: selectedTags } : {})
      }
    }, undefined, { shallow: true });
  };
  
  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  const allTags = Array.from(new Set(MOCK_SERVERS.flatMap(server => server.tags)));
  
  return (
    <Layout title="浏览服务器 | MCP Cloud">
      <Box mb={8}>
        <Heading mb={2}>浏览服务器</Heading>
        <Text color="gray.600">发现和探索MCP服务器</Text>
      </Box>
      
      <Box mb={8} p={6} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={borderColor}>
        <form onSubmit={handleSearch}>
          <Stack spacing={4}>
            <InputGroup size="md">
              <Input
                placeholder="搜索服务器..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" type="submit">
                  <SearchIcon />
                </Button>
              </InputRightElement>
            </InputGroup>
            
            <Flex wrap="wrap" gap={2}>
              {selectedTags.map(tag => (
                <Tag key={tag} size="md" colorScheme="blue" borderRadius="full" variant="solid">
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                </Tag>
              ))}
            </Flex>
            
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
              <Box flex={{ md: 2 }}>
                <Select
                  placeholder="选择标签..."
                  onChange={(e) => handleAddTag(e.target.value)}
                  value=""
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </Select>
              </Box>
              <Box flex={{ md: 1 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="downloads">下载量</option>
                  <option value="rating">评分</option>
                  <option value="newest">最新更新</option>
                  <option value="name">名称</option>
                </Select>
              </Box>
            </Flex>
          </Stack>
        </form>
      </Box>
      
      {loading ? (
        <Flex justify="center" align="center" minH="300px" direction="column">
          <Spinner size="xl" mb={4} />
          <Text>加载服务器中...</Text>
        </Flex>
      ) : error ? (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      ) : servers.length === 0 ? (
        <Alert status="info" mb={6}>
          <AlertIcon />
          没有找到匹配的服务器
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {servers.map(server => (
            <Box
              key={server.id}
              p={6}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              bg={cardBg}
              borderColor={borderColor}
              boxShadow="md"
              transition="transform 0.3s"
              _hover={{ transform: 'translateY(-5px)', cursor: 'pointer' }}
              onClick={() => router.push(`/servers/${server.id}`)}
            >
              <HStack mb={2}>
                <Icon as={FiServer} />
                <Heading size="md" isTruncated>
                  {server.name}
                </Heading>
              </HStack>
              
              <Text mb={4} noOfLines={2}>
                {server.description}
              </Text>
              
              <Flex wrap="wrap" gap={2} mb={4}>
                {server.tags.map(tag => (
                  <Badge key={tag} colorScheme="blue" mr={2}>
                    {tag}
                  </Badge>
                ))}
              </Flex>
              
              <Text mb={2} fontSize="sm" color="gray.500">
                版本: {server.version}
              </Text>
              
              <Flex justify="space-between" align="center">
                <Flex align="center">
                  <Icon as={FiDownload} mr={1} />
                  <Text fontWeight="medium">{server.downloads}</Text>
                </Flex>
                <Flex align="center">
                  <Icon as={FiStar} mr={1} color="yellow.400" />
                  <Text fontWeight="medium">{server.rating.toFixed(1)}</Text>
                </Flex>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Layout>
  );
};

export default ServerListPage; 