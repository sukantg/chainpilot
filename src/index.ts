import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { compareProtocols } from '../graph/compare.js';
import { getBalance, transferHBAR } from '../hedera/client.js';
import { purchaseResearch } from './purchase-research.js';

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

  server.registerTool(
    'wallet_balance',
    {
      description: 'Returns the HBAR balance of the configured Hedera Testnet wallet',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const balance = await getBalance();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(balance, null, 2),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch wallet balance';

        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    'transfer_hbar',
    {
      description: 'Transfer HBAR on Hedera Testnet to a recipient account',
      inputSchema: z.object({
        recipient: z.string().describe('Recipient Hedera account ID, e.g. 0.0.3'),
        amount: z.number().positive().describe('Amount of HBAR to send'),
      }),
    },
    async ({ recipient, amount }) => {
      try {
        const result = await transferHBAR(recipient, amount);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  transactionHash: result.transactionId,
                  status: result.status,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to transfer HBAR';

        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    'purchase_research',
    {
      description:
        'Pay for and receive a markdown protocol comparison research report',
      inputSchema: z.object({
        protocolA: z.string().describe('First protocol name, e.g. uniswap'),
        protocolB: z.string().describe('Second protocol name, e.g. aave'),
        amount: z.number().positive().describe('Payment amount in HBAR'),
        recipient: z
          .string()
          .optional()
          .describe('Payment recipient account ID (defaults to RESEARCH_PAYMENT_RECIPIENT)'),
      }),
    },
    async ({ protocolA, protocolB, amount, recipient }) => {
      try {
        const result = await purchaseResearch({
          protocolA,
          protocolB,
          amount,
          recipient,
        });

        return {
          content: [{ type: 'text', text: result.report }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to purchase research';

        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    },
  );

  return server;
}

void serveStdio(createServer);
console.error('ChainPilot MCP server running on stdio');
