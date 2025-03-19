/** @type {import('next').NextConfig} */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['express'],
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/v1/:path*'
      }
    ];
  },
  /* config options here */
};

export default nextConfig;
