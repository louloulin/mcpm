import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Text,
  Container,
  Avatar,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';

const NavLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <NextLink href={href} passHref>
    <Link
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
    >
      {children}
    </Link>
  </NextLink>
);

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4} boxShadow={'sm'}>
      <Container maxW="container.xl">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <NextLink href="/" passHref>
              <Box cursor="pointer" fontWeight="bold" fontSize="xl">MCP Cloud</Box>
            </NextLink>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              <NavLink href="/servers">服务器</NavLink>
              <NavLink href="/dashboard">仪表盘</NavLink>
              <NavLink href="/documentation">文档</NavLink>
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Button onClick={toggleColorMode} mr={4}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
            
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <Avatar
                  size={'sm'}
                />
              </MenuButton>
              <MenuList>
                <MenuItem>个人信息</MenuItem>
                <MenuItem>设置</MenuItem>
                <MenuDivider />
                <MenuItem>退出登录</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
        
        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              <NavLink href="/servers">服务器</NavLink>
              <NavLink href="/dashboard">仪表盘</NavLink>
              <NavLink href="/documentation">文档</NavLink>
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
} 