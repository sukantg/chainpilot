import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ['@hashgraph/sdk'],
  outputFileTracingIncludes: {
    '/api/mcp': ['./backend-dist/**/*'],
  },
};

export default nextConfig;
