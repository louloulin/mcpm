import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MCP服务器存储库',
    description: '发现、分享和部署MCP服务器',
    keywords: 'MCP, Model Context Protocol, 服务器, AI, 人工智能, 开发者平台',
    openGraph: {
        title: 'MCP服务器 - 发现优质的MCP协议服务',
        description:
            'MCP服务器是一个用户发现、分享和部署顶级MCP协议服务的平台，释放AI能力，加速创新。',
        url: `https://mcpm.com`,
        siteName: 'MCP服务器',
        images: [
            {
                url: 'https://mcpm.com/open-graph.jpg',
                width: 1200,
                height: 630,
                alt: 'mcpm.com',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MCP服务器 - 发现优质的MCP协议服务',
        description:
            'MCP服务器是一个用户发现、分享和部署顶级MCP协议服务的平台，释放AI能力，加速创新。',
        creator: '@1ronben',
        images: [
            {
                url: 'https://mcpm.com/open-graph.jpg',
                width: 1200,
                height: 630,
                alt: 'mcpm.com',
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
        <html lang="zh" suppressHydrationWarning>
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <ToastProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <AuthProvider>
                            <Navbar />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </AuthProvider>
                    </ThemeProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
