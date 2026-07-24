import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { compareProtocols } from '../graph/compare.js';

function createServer(): McpServer {
  const server = new McpServer({ name: 'chainpilot', version: '1.0.0' });

  server.registerTool(
    'hello',
    {
      description: 'Returns a greeting from ChainPilot',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: 'text', text: 'Hello from ChainPilot' }],
    }),
  );

  server.registerTool(
    'compare_protocols',
    {
      description: 'Compare two DeFi protocols by TVL, volume, and transaction count',
      inputSchema: z.object({
        protocolA: z.string().describe('First protocol name, e.g. uniswap'),
        protocolB: z.string().describe('Second protocol name, e.g. aave'),
      }),
    },
    async ({ protocolA, protocolB }) => {
      const result = await compareProtocols(protocolA, protocolB);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

void serveStdio(createServer);
console.error('ChainPilot MCP server running on stdio');
