import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import NextLink from 'next/link';

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
            <NextLink href={'/'} passHref>
              <Link>首页</Link>
            </NextLink>
            <NextLink href={'/about'} passHref>
              <Link>关于我们</Link>
            </NextLink>
            <NextLink href={'/contact'} passHref>
              <Link>联系我们</Link>
            </NextLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              服务器
            </Text>
            <NextLink href={'/servers'} passHref>
              <Link>浏览服务器</Link>
            </NextLink>
            <NextLink href={'/upload'} passHref>
              <Link>上传服务器</Link>
            </NextLink>
            <NextLink href={'/documentation'} passHref>
              <Link>开发文档</Link>
            </NextLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              资源
            </Text>
            <NextLink href={'/documentation'} passHref>
              <Link>API文档</Link>
            </NextLink>
            <NextLink href={'https://mcp.ai/docs'} passHref>
              <Link isExternal>MCP协议</Link>
            </NextLink>
            <NextLink href={'/blog'} passHref>
              <Link>博客</Link>
            </NextLink>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
              法律信息
            </Text>
            <NextLink href={'/privacy'} passHref>
              <Link>隐私政策</Link>
            </NextLink>
            <NextLink href={'/terms'} passHref>
              <Link>使用条款</Link>
            </NextLink>
            <NextLink href={'/cookies'} passHref>
              <Link>Cookie政策</Link>
            </NextLink>
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
