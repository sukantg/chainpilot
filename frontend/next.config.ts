import type { NextConfig } from 'next';

const backendBundle = './src/server/chainpilot-backend/**/*';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@hashgraph/sdk', '@hiero-ledger/sdk', '@x402/core', '@x402/hedera'],
  outputFileTracingIncludes: {
    '/*': [backendBundle],
    '/api/mcp': [backendBundle],
    '/api/health': [backendBundle],
  },
};

export default nextConfig;
