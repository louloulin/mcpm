import { Box, Container } from '@chakra-ui/react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function Layout({ children, title = 'MCP Cloud - 服务器托管平台' }: LayoutProps) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Head>
        <title>{title}</title>
        <meta name="description" content="MCP Cloud 是一个现代化的MCP服务器托管平台" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      
      <Box as="main" flex="1">
        <Container maxW="container.xl" pt={8}>
          {children}
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
} 