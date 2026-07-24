import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

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

  return server;
}

void serveStdio(createServer);
console.error('ChainPilot MCP server running on stdio');
