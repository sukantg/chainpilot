import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@hashgraph/sdk'],
  outputFileTracingIncludes: {
    '/api/mcp': [
      './backend-dist/**/*',
      './src/server/chainpilot-backend/**/*',
    ],
  },
};

export default nextConfig;
