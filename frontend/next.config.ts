import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@hashgraph/sdk', '@hiero-ledger/sdk', '@x402/core', '@x402/hedera'],
  outputFileTracingIncludes: {
    '/api/mcp': ['./src/server/chainpilot-backend/**/*'],
  },
};

export default nextConfig;
