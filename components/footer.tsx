"use client";

import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react';
import NextLink from 'next/link';

export default function Footer() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={bgColor}
      color={textColor}
      mt={20}
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor={borderColor}
    >
      <Container as={Stack} maxW={'container.xl'} py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              MCP Cloud
            </Text>
            <ChakraLink as={NextLink} href="/" _hover={{ color: 'blue.400' }}>首页</ChakraLink>
            <ChakraLink as={NextLink} href="/about" _hover={{ color: 'blue.400' }}>关于我们</ChakraLink>
            <ChakraLink as={NextLink} href="/contact" _hover={{ color: 'blue.400' }}>联系我们</ChakraLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              服务器
            </Text>
            <ChakraLink as={NextLink} href="/servers" _hover={{ color: 'blue.400' }}>浏览服务器</ChakraLink>
            <ChakraLink as={NextLink} href="/upload" _hover={{ color: 'blue.400' }}>上传服务器</ChakraLink>
            <ChakraLink as={NextLink} href="/documentation" _hover={{ color: 'blue.400' }}>开发文档</ChakraLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              资源
            </Text>
            <ChakraLink as={NextLink} href="/documentation" _hover={{ color: 'blue.400' }}>API文档</ChakraLink>
            <ChakraLink href="https://mcp.ai/docs" isExternal _hover={{ color: 'blue.400' }}>MCP协议</ChakraLink>
            <ChakraLink as={NextLink} href="/blog" _hover={{ color: 'blue.400' }}>博客</ChakraLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              法律信息
            </Text>
            <ChakraLink as={NextLink} href="/privacy" _hover={{ color: 'blue.400' }}>隐私政策</ChakraLink>
            <ChakraLink as={NextLink} href="/terms" _hover={{ color: 'blue.400' }}>使用条款</ChakraLink>
            <ChakraLink as={NextLink} href="/cookies" _hover={{ color: 'blue.400' }}>Cookie政策</ChakraLink>
          </Stack>
        </SimpleGrid>
      </Container>
      <Box py={4} borderTopWidth={1} borderStyle={'solid'} borderColor={borderColor}>
        <Container
          as={Stack}
          maxW={'container.xl'}
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify={{ md: 'space-between' }}
          align={{ md: 'center' }}
        >
          <Text>© {new Date().getFullYear()} MCP Cloud. 保留所有权利</Text>
        </Container>
      </Box>
    </Box>
  );
}
