import React, { useState, useEffect } from 'react';
import { Server } from '../lib/types';
import {
  Box,
  Heading,
  Text,
  Button,
  Link,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiExternalLink, FiCode, FiBook } from 'react-icons/fi';
import NextLink from 'next/link';

interface ServerApiDocsProps {
  server: Server;
  showFullDocs?: boolean;
}

/**
 * 服务器API文档组件
 * 
 * 该组件用于显示服务器的API文档，包括：
 * - 文档概述
 * - 嵌入式文档查看器
 * - 在新窗口中打开文档的链接
 */
const ServerApiDocs: React.FC<ServerApiDocsProps> = ({ server, showFullDocs = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasApiDocs, setHasApiDocs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 背景色
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 检查服务器是否有API文档
  useEffect(() => {
    const checkApiDocs = async () => {
      try {
        setLoading(true);
        
        // 发送请求检查API文档是否存在
        const res = await fetch(`/api/docs/${server.id}`);
        
        if (res.ok) {
          setHasApiDocs(true);
        } else {
          setHasApiDocs(false);
          
          // 如果是404错误（文档不存在），不显示错误消息
          if (res.status !== 404) {
            const data = await res.json();
            setError(data.error || '无法加载API文档');
          }
        }
      } catch (err) {
        console.error('检查API文档时出错:', err);
        setError('检查API文档时出错');
      } finally {
        setLoading(false);
      }
    };
    
    checkApiDocs();
  }, [server.id]);
  
  // 如果正在加载
  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" />
        <Text mt={4}>正在检查API文档...</Text>
      </Box>
    );
  }
  
  // 如果发生错误
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>加载出错!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // 如果没有API文档
  if (!hasApiDocs) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={bgColor}>
        <Flex align="center" mb={2}>
          <Icon as={FiBook} mr={2} />
          <Heading size="md">API文档</Heading>
        </Flex>
        <Divider my={3} />
        <Text>该服务器没有提供API文档。</Text>
        {server.homepage && (
          <Button
            as="a"
            href={server.homepage}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="sm"
            mt={4}
            leftIcon={<FiExternalLink />}
          >
            访问服务器主页
          </Button>
        )}
      </Box>
    );
  }
  
  // 嵌入式文档查看器
  const ApiDocsIframe = () => (
    <Box 
      borderWidth="1px" 
      borderRadius="md" 
      overflow="hidden" 
      borderColor={borderColor}
      height={showFullDocs ? "80vh" : "500px"}
    >
      <iframe 
        src={`/api/docs/${server.id}`} 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none' 
        }}
        title={`${server.name} API文档`}
      />
    </Box>
  );
  
  // 文档使用指南
  const ApiDocsGuide = () => (
    <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={bgColor}>
      <Heading size="md" mb={4}>使用说明</Heading>
      <Text mb={3}>
        此API文档展示了服务器的所有可用API端点、参数和返回值。您可以使用这些API与服务器进行交互。
      </Text>
      <Text mb={3}>
        要直接调用这些API，您需要：
      </Text>
      <Box as="ol" pl={6} mb={4}>
        <Box as="li" mb={2}>安装并运行该服务器</Box>
        <Box as="li" mb={2}>使用适当的API客户端或代码向服务器发送请求</Box>
        <Box as="li" mb={2}>按照文档中指定的格式构造请求参数</Box>
      </Box>
      <Text fontWeight="bold" mb={2}>
        示例代码可能包含在文档中，或者您可以查看服务器的示例代码部分。
      </Text>
    </Box>
  );
  
  // 如果是显示完整文档模式
  if (showFullDocs) {
    return (
      <Box>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="lg">{server.name} API文档</Heading>
          <Button
            as="a"
            href={`/api/docs/${server.id}`}
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="blue"
            leftIcon={<FiExternalLink />}
          >
            在新窗口中打开
          </Button>
        </Flex>
        <ApiDocsIframe />
      </Box>
    );
  }
  
  // 默认视图（带标签页）
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={bgColor}>
      <Flex align="center" justify="space-between" mb={4}>
        <Flex align="center">
          <Icon as={FiCode} mr={2} />
          <Heading size="md">API文档</Heading>
        </Flex>
        <NextLink href={`/servers/${server.id}/docs`} passHref>
          <Button
            as="a"
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<FiExternalLink />}
          >
            查看完整文档
          </Button>
        </NextLink>
      </Flex>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>文档预览</Tab>
          <Tab>使用说明</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0} pt={4}>
            <ApiDocsIframe />
          </TabPanel>
          <TabPanel>
            <ApiDocsGuide />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ServerApiDocs; 