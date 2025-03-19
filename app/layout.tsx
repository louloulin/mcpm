import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MCPR - MCP服务器存储库',
    description: '发现、分享和管理MCP (Model Context Protocol) 服务器的集中式平台',
    keywords: ['MCP', 'MCPR', '服务器', '存储库', 'API', '工具', 'AI', '大模型'],
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
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body className={inter.className}>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
