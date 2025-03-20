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
import Link from 'next/link';

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      mt={20}
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container as={Stack} maxW={'container.xl'} py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              MCP Cloud
            </Text>
            <Link href="/" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>首页</ChakraLink>
            </Link>
            <Link href="/about" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>关于我们</ChakraLink>
            </Link>
            <Link href="/contact" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>联系我们</ChakraLink>
            </Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              服务器
            </Text>
            <Link href="/servers" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>浏览服务器</ChakraLink>
            </Link>
            <Link href="/upload" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>上传服务器</ChakraLink>
            </Link>
            <Link href="/documentation" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>开发文档</ChakraLink>
            </Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              资源
            </Text>
            <Link href="/documentation" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>API文档</ChakraLink>
            </Link>
            <ChakraLink href="https://mcp.ai/docs" isExternal display="block" py={1} _hover={{ color: 'blue.400' }}>MCP协议</ChakraLink>
            <Link href="/blog" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>博客</ChakraLink>
            </Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              法律信息
            </Text>
            <Link href="/privacy" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>隐私政策</ChakraLink>
            </Link>
            <Link href="/terms" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>使用条款</ChakraLink>
            </Link>
            <Link href="/cookies" passHref>
              <ChakraLink display="block" py={1} _hover={{ color: 'blue.400' }}>Cookie政策</ChakraLink>
            </Link>
          </Stack>
        </SimpleGrid>
      </Container>
      <Box py={4} borderTopWidth={1} borderStyle={'solid'} borderColor={useColorModeValue('gray.200', 'gray.700')}>
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
