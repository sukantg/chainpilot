import path from 'path';
import { pathToFileURL } from 'url';
import { loadBackendEnv } from './env';
import type { McpToolName } from '@/lib/mcp-definitions';

loadBackendEnv();

export interface McpToolResult {
  data: unknown;
  isError: boolean;
}

interface BackendModules {
  compareMultipleProtocols: (protocols: string[]) => Promise<unknown>;
  getMarketSummary: () => Promise<unknown>;
  getProtocol: (name: string) => Promise<{
    name: string;
    totalValueLockedUSD: string;
    totalVolumeUSD: string;
    txCount: string;
  }>;
  listProtocols: () => unknown[];
  getBalance: () => Promise<{ accountId: string; hbar: string; tinybars: string }>;
  transferHBAR: (
    to: string,
    amount: number,
  ) => Promise<{ transactionId: string; status: string }>;
  purchaseResearch: (input: {
    protocolA: string;
    protocolB: string;
    amount: number;
    recipient?: string;
  }) => Promise<{ report: string; payment: Record<string, unknown> }>;
}

let backendPromise: Promise<BackendModules> | null = null;

async function loadBackend(): Promise<BackendModules> {
  const root = path.join(process.cwd(), '..');
  const dist = path.join(root, 'dist');

  const importFromDist = (modulePath: string) =>
    import(/* webpackIgnore: true */ pathToFileURL(path.join(dist, modulePath)).href);

  const [compare, client, config, hedera, research] = await Promise.all([
    importFromDist('graph/compare.js'),
    importFromDist('graph/client.js'),
    importFromDist('graph/config.js'),
    importFromDist('hedera/client.js'),
    importFromDist('src/purchase-research.js'),
  ]);

  return {
    compareMultipleProtocols: compare.compareMultipleProtocols,
    getMarketSummary: compare.getMarketSummary,
    getProtocol: client.getProtocol,
    listProtocols: config.listProtocols,
    getBalance: hedera.getBalance,
    transferHBAR: hedera.transferHBAR,
    purchaseResearch: research.purchaseResearch,
  };
}

function getBackend(): Promise<BackendModules> {
  if (!backendPromise) {
    backendPromise = loadBackend();
  }
  return backendPromise;
}

export async function executeMcpTool(
  name: McpToolName,
  args: Record<string, unknown> = {},
): Promise<McpToolResult> {
  try {
    const backend = await getBackend();

    switch (name) {
      case 'hello':
        return { data: { message: 'Hello from ChainPilot' }, isError: false };

      case 'list_protocols':
        return { data: { protocols: backend.listProtocols() }, isError: false };

      case 'get_protocol': {
        const protocol = String(args.protocol ?? '');
        const result = await backend.getProtocol(protocol);
        return {
          data: {
            name: result.name,
            tvl: result.totalValueLockedUSD,
            volume: result.totalVolumeUSD,
            transactionCount: result.txCount,
          },
          isError: false,
        };
      }

      case 'compare_multiple_protocols': {
        const protocols = args.protocols as string[];
        const result = await backend.compareMultipleProtocols(protocols);
        return { data: result, isError: false };
      }

      case 'market_summary': {
        const summary = await backend.getMarketSummary();
        return { data: summary, isError: false };
      }

      case 'wallet_balance': {
        const balance = await backend.getBalance();
        return { data: balance, isError: false };
      }

      case 'transfer_hbar': {
        const recipient = String(args.recipient ?? '');
        const amount = Number(args.amount);
        const result = await backend.transferHBAR(recipient, amount);
        return {
          data: {
            transactionHash: result.transactionId,
            status: result.status,
          },
          isError: false,
        };
      }

      case 'purchase_research': {
        const result = await backend.purchaseResearch({
          protocolA: String(args.protocolA ?? ''),
          protocolB: String(args.protocolB ?? ''),
          amount: Number(args.amount),
          recipient: args.recipient ? String(args.recipient) : undefined,
        });
        return {
          data: {
            report: result.report,
            payment: result.payment,
          },
          isError: false,
        };
      }

      default:
        return { data: { error: `Unknown tool: ${name}` }, isError: true };
    }
  } catch (error) {
    return {
      data: {
        error: error instanceof Error ? error.message : 'Tool execution failed',
      },
      isError: true,
    };
  }
}
