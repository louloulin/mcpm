import { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  SimpleGrid, 
  Input, 
  InputGroup, 
  InputRightElement,
  Flex,
  Stack,
  useColorModeValue,
  Icon,
  Container,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiServer, FiCloud, FiTool, FiZap } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// 模拟的特色服务器数据
const FEATURED_SERVERS = [
  {
    id: 'server-1',
    name: '简单问候服务器',
    description: '基础的问候服务，提供友好的API接口',
    downloads: 1240,
    rating: 4.5,
    tags: ['入门', '示例', '简单'],
  },
  {
    id: 'server-2',
    name: '智能回复助手',
    description: '使用AI技术提供智能回复功能的MCP服务器',
    downloads: 857,
    rating: 4.8,
    tags: ['AI', '对话', '助手'],
  },
  {
    id: 'server-3',
    name: '数据分析引擎',
    description: '强大的数据处理和分析功能，支持多种数据格式',
    downloads: 632,
    rating: 4.2,
    tags: ['数据', '分析', '高级'],
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/servers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const featureBg = useColorModeValue('gray.100', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Layout>
      {/* 英雄区域 */}
      <Box
        as="section"
        py={{ base: 14, md: 20 }}
        px={8}
        bg={useColorModeValue('blue.50', 'gray.900')}
        borderRadius="lg"
        mb={16}
        textAlign="center"
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.lg">
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '5xl' }}
            mb={4}
            fontWeight="bold"
          >
            打造下一代<Text as="span" color="blue.500">MCP服务器</Text>体验
          </Heading>
          
          <Text fontSize={{ base: 'lg', md: 'xl' }} maxW="2xl" mx="auto" mb={8} opacity={0.9}>
            发现、部署和管理MCP服务器的统一平台，让AI功能集成变得前所未有的简单。
          </Text>
          
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            justifyContent="center"
          >
            <Button colorScheme="blue" size="lg" onClick={() => router.push('/servers')}>
              浏览服务器
            </Button>
            <Button colorScheme="blue" variant="outline" size="lg" onClick={() => router.push('/documentation')}>
              查看文档
            </Button>
          </Stack>
        </Container>
      </Box>
      
      {/* 搜索区域 */}
      <Box mb={16}>
        <Heading as="h2" size="lg" textAlign="center" mb={6}>
          搜索MCP服务器
        </Heading>
        
        <Box maxW="600px" mx="auto">
          <form onSubmit={handleSearch}>
            <InputGroup size="lg">
              <Input
                placeholder="搜索服务器名称、标签或功能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="full"
                boxShadow="sm"
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" type="submit" colorScheme="blue" borderRadius="full">
                  <SearchIcon />
                </Button>
              </InputRightElement>
            </InputGroup>
          </form>
        </Box>
      </Box>
      
      {/* 特点介绍 */}
      <Box mb={16}>
        <Heading as="h2" size="lg" textAlign="center" mb={10}>
          平台特点
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
          <Box p={6} bg={featureBg} borderRadius="lg" textAlign="center">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="full"
              bg="blue.500"
              mb={4}
              mx="auto"
            >
              <Icon as={FiServer} color="white" boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" mb={3}>
              简单部署
            </Heading>
            <Text>一键部署任何MCP服务器，无需复杂配置</Text>
          </Box>
          
          <Box p={6} bg={featureBg} borderRadius="lg" textAlign="center">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="full"
              bg="blue.500"
              mb={4}
              mx="auto"
            >
              <Icon as={FiCloud} color="white" boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" mb={3}>
              云托管
            </Heading>
            <Text>可靠的云端托管，确保服务器高可用性</Text>
          </Box>
          
          <Box p={6} bg={featureBg} borderRadius="lg" textAlign="center">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="full"
              bg="blue.500"
              mb={4}
              mx="auto"
            >
              <Icon as={FiTool} color="white" boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" mb={3}>
              丰富工具
            </Heading>
            <Text>集成多种工具和服务，扩展服务器功能</Text>
          </Box>
          
          <Box p={6} bg={featureBg} borderRadius="lg" textAlign="center">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="full"
              bg="blue.500"
              mb={4}
              mx="auto"
            >
              <Icon as={FiZap} color="white" boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" mb={3}>
              实时监控
            </Heading>
            <Text>全面的监控和分析，随时了解服务器状态</Text>
          </Box>
        </SimpleGrid>
      </Box>
      
      {/* 特色服务器 */}
      <Box mb={16}>
        <Heading as="h2" size="lg" textAlign="center" mb={10}>
          特色服务器
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {FEATURED_SERVERS.map((server) => (
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
              <Heading as="h3" size="md" mb={2}>
                {server.name}
              </Heading>
              
              <Text mb={4} height="3em" overflow="hidden">
                {server.description}
              </Text>
              
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="bold">{server.downloads} 下载</Text>
                <Flex align="center">
                  <Text fontWeight="bold" mr={1}>{server.rating}</Text>
                  <Text color="yellow.500">★</Text>
                </Flex>
              </Flex>
              
              <Flex wrap="wrap" gap={2}>
                {server.tags.map((tag) => (
                  <Badge key={tag} colorScheme="blue">
                    {tag}
                  </Badge>
                ))}
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
        
        <Box textAlign="center" mt={8}>
          <Button 
            colorScheme="blue" 
            variant="outline"
            size="lg"
            onClick={() => router.push('/servers')}
          >
            查看全部服务器
          </Button>
        </Box>
      </Box>
      
      {/* CTA区域 */}
      <Box
        as="section"
        py={10}
        px={8}
        bg={useColorModeValue('blue.500', 'blue.600')}
        color="white"
        borderRadius="lg"
        textAlign="center"
      >
        <Heading as="h2" size="lg" mb={4}>
          准备好开始使用了吗？
        </Heading>
        
        <Text fontSize="lg" maxW="2xl" mx="auto" mb={6}>
          快速创建您的MCP Cloud账户，开始使用强大的MCP服务器。
        </Text>
        
        <Button 
          size="lg" 
          colorScheme="whiteAlpha"
          onClick={() => router.push('/register')}
        >
          免费注册
        </Button>
      </Box>
    </Layout>
  );
} 