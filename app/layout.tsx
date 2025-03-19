import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { AuthProvider } from '../contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MCP服务器存储库',
    description: '发现、分享和部署MCP服务器',
    keywords: 'MCP, Model Context Protocol, 服务器, AI, 人工智能, 开发者平台',
    openGraph: {
        title: 'MCPServer - Discover Exceptional MCP Servers',
        description:
            'MCPSvr is a hub for users to discover top MCP servers, unlocking advanced AI capabilities and accelerating innovation.',
        url: `https://mcpsvr.com`,
        siteName: 'MCPSvr',
        images: [
            {
                url: 'https://mcpsvr.com/open-graph.jpg',
                width: 1200,
                height: 630,
                alt: 'mcpsvr.com',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MCPServer -Discover Exceptional MCP Servers',
        description:
            'MCPSvr is a hub for users to discover top MCP servers, unlocking advanced AI capabilities and accelerating innovation.',
        creator: '@1ronben',
        images: [
            {
                url: 'https://mcpsvr.com/open-graph.jpg',
                width: 1200,
                height: 630,
                alt: 'mcpsvr.com',
            },
        ],
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh">
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <AuthProvider>
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    );
}
