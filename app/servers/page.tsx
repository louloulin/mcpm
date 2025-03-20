"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Container,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiServer, FiDownload, FiStar } from 'react-icons/fi';

// 模拟服务器数据
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

export default function ServerListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState(MOCK_SERVERS);
  const [filteredServers, setFilteredServers] = useState(MOCK_SERVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('downloads');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 加载服务器列表
  useEffect(() => {
    const fetchServers = async () => {
      try {
        setIsLoading(true);
        
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 使用模拟数据
        setServers(MOCK_SERVERS);
        setFilteredServers(MOCK_SERVERS);
        setError(null);
      } catch (err) {
        setError('加载服务器列表时出错');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServers();
  }, []);
  
  // 处理筛选和排序
  useEffect(() => {
    let filtered = [...servers];
    
    // 根据搜索关键词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server => (
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query)
      ));
    }
    
    // 根据标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(server => (
        selectedTags.every(tag => server.tags.includes(tag))
      ));
    }
    
    // 根据选项排序
    switch (sortOption) {
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredServers(filtered);
  }, [servers, searchQuery, selectedTags, sortOption]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索已在useEffect中处理
  };
  
  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  // 获取所有可用标签
  const allTags = Array.from(new Set(servers.flatMap(server => server.tags)));
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={2}>浏览服务器</Heading>
        <Text color="gray.600">发现可用的MCP服务器</Text>
      </Box>
      
      {/* 搜索和筛选 */}
      <Flex
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        align={{ md: 'center' }}
      >
        <Box flex="1" as="form" onSubmit={handleSearch}>
          <InputGroup>
            <Input
              placeholder="搜索服务器..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputRightElement>
              <Button variant="ghost" type="submit">
                <SearchIcon />
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>
        
        <Box width={{ base: '100%', md: '200px' }}>
          <Select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="downloads">按下载量</option>
            <option value="rating">按评分</option>
            <option value="newest">按发布时间</option>
            <option value="name">按名称</option>
          </Select>
        </Box>
      </Flex>
      
      {/* 标签筛选 */}
      <Box mb={6}>
        <Text fontWeight="medium" mb={2}>按标签筛选:</Text>
        <Flex flexWrap="wrap" gap={2}>
          {allTags.map(tag => (
            <Tag
              key={tag}
              size="md"
              variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
              colorScheme="blue"
              cursor="pointer"
              onClick={() => selectedTags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)}
            >
              <TagLabel>{tag}</TagLabel>
              {selectedTags.includes(tag) && (
                <TagCloseButton onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }} />
              )}
            </Tag>
          ))}
        </Flex>
      </Box>
      
      {/* 错误提示 */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* 加载中 */}
      {isLoading ? (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : filteredServers.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">没有找到匹配的服务器</Text>
          {(searchQuery || selectedTags.length > 0) && (
            <Button
              mt={4}
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
              }}
            >
              清除筛选条件
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredServers.map((server) => (
            <Box
              key={server.id}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              bg={bgColor}
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: 'md' }}
              cursor="pointer"
              onClick={() => router.push(`/servers/${server.id}`)}
            >
              <HStack spacing={3} mb={2}>
                <Icon as={FiServer} boxSize={5} color="blue.500" />
                <Heading as="h3" size="md" isTruncated>{server.name}</Heading>
              </HStack>
              
              <Text 
                color="gray.600" 
                mb={3} 
                noOfLines={2}
                height="40px"
              >
                {server.description}
              </Text>
              
              <Flex wrap="wrap" mb={3}>
                {server.tags.map(tag => (
                  <Tag 
                    key={tag} 
                    size="sm" 
                    colorScheme="blue" 
                    m={0.5}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTag(tag);
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </Flex>
              
              <Stack spacing={1} mb={3}>
                <Flex align="center">
                  <Text fontWeight="medium" mr={1}>版本:</Text>
                  <Text>{server.version}</Text>
                  <Badge ml={2} colorScheme="green">{server.license}</Badge>
                </Flex>
                <Flex align="center">
                  <Text fontWeight="medium" mr={1}>作者:</Text>
                  <Text>{server.author.name}</Text>
                </Flex>
              </Stack>
              
              <Flex justify="space-between" mt={4}>
                <Flex align="center">
                  <Icon as={FiDownload} color="blue.500" mr={1} />
                  <Text>{server.downloads.toLocaleString()}</Text>
                </Flex>
                <Flex align="center">
                  <Icon as={FiStar} color="yellow.500" mr={1} />
                  <Text>{server.rating}</Text>
                </Flex>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
} 