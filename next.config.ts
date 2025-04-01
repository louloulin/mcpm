/** @type {import('next').NextConfig} */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['express'],
  eslint: {
    // 禁用构建过程中的ESLint检查
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 禁用构建过程中的TypeScript类型检查
    ignoreBuildErrors: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/v1/:path*'
      }
    ];
  },
  output: 'standalone',
  experimental: {
    // 启用软件包优化
    optimizePackageImports: ['recharts', '@radix-ui/react-icons'],
  },
  /* config options here */
};

export default nextConfig;
