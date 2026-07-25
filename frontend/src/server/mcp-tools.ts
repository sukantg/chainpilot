import path from 'path';
import { pathToFileURL } from 'url';
import { loadBackendEnv } from './env';
import { resolveBackendDist } from './backend-path';
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
    paymentAlreadySettled?: boolean;
    paymentTxId?: string;
    paymentStatus?: string;
  }) => Promise<{ report: string; payment: Record<string, unknown> }>;
  hashResult: (data: unknown) => string;
  logReceiptToHCS: (payload: {
    tool: string;
    paymentTxId: string;
    payer?: string;
    args?: Record<string, unknown>;
    resultHash: string;
  }) => Promise<string>;
}

let backendPromise: Promise<BackendModules> | null = null;

async function loadBackend(): Promise<BackendModules> {
  let dist: string;
  try {
    dist = resolveBackendDist(import.meta.url);
  } catch (error) {
    backendPromise = null;
    throw error;
  }

  const importFromDist = (modulePath: string) =>
    import(/* webpackIgnore: true */ pathToFileURL(path.join(dist, modulePath)).href);

  try {
    const [compare, client, config, hedera, research, hcs] = await Promise.all([
      importFromDist('graph/compare.js'),
      importFromDist('graph/client.js'),
      importFromDist('graph/config.js'),
      importFromDist('hedera/client.js'),
      importFromDist('src/purchase-research.js'),
      importFromDist('hedera/hcs.js'),
    ]);

    return {
      compareMultipleProtocols: compare.compareMultipleProtocols,
      getMarketSummary: compare.getMarketSummary,
      getProtocol: client.getProtocol,
      listProtocols: config.listProtocols,
      getBalance: hedera.getBalance,
      transferHBAR: hedera.transferHBAR,
      purchaseResearch: research.purchaseResearch,
      hashResult: hcs.hashResult,
      logReceiptToHCS: hcs.logReceiptToHCS,
    };
  } catch (error) {
    backendPromise = null;
    const message = error instanceof Error ? error.message : 'Unknown backend import error';
    throw new Error(`Failed to load ChainPilot backend from ${dist}: ${message}`);
  }
}

function getBackend(): Promise<BackendModules> {
  if (!backendPromise) {
    backendPromise = loadBackend();
  }
  return backendPromise;
}

export interface ExecuteMcpToolOptions {
  paymentAlreadySettled?: boolean;
  paymentTxId?: string;
  paymentStatus?: string;
  payer?: string;
}

export type McpToolResultWithReceipt = McpToolResult & {
  receipt?: { hcsTxId: string; resultHash: string };
};

export async function executeMcpTool(
  name: McpToolName,
  args: Record<string, unknown> = {},
  options: ExecuteMcpToolOptions = {},
): Promise<McpToolResultWithReceipt> {
  const backend = await getBackend();

  let result: McpToolResult;

  try {
    switch (name) {
      case 'hello':
        result = { data: { message: 'Hello from ChainPilot' }, isError: false };
        break;

      case 'list_protocols':
        result = { data: { protocols: backend.listProtocols() }, isError: false };
        break;

      case 'get_protocol': {
        const protocol = String(args.protocol ?? '');
        const metrics = await backend.getProtocol(protocol);
        result = {
          data: {
            name: metrics.name,
            tvl: metrics.totalValueLockedUSD,
            volume: metrics.totalVolumeUSD,
            transactionCount: metrics.txCount,
          },
          isError: false,
        };
        break;
      }

      case 'compare_multiple_protocols': {
        const protocols = args.protocols as string[];
        const comparison = await backend.compareMultipleProtocols(protocols);
        result = { data: comparison, isError: false };
        break;
      }

      case 'market_summary': {
        const summary = await backend.getMarketSummary();
        result = { data: summary, isError: false };
        break;
      }

      case 'wallet_balance': {
        const balance = await backend.getBalance();
        result = { data: balance, isError: false };
        break;
      }

      case 'transfer_hbar': {
        const recipient = String(args.recipient ?? '');
        const amount = Number(args.amount);
        const transfer = await backend.transferHBAR(recipient, amount);
        result = {
          data: {
            transactionHash: transfer.transactionId,
            status: transfer.status,
          },
          isError: false,
        };
        break;
      }

      case 'purchase_research': {
        const research = await backend.purchaseResearch({
          protocolA: String(args.protocolA ?? ''),
          protocolB: String(args.protocolB ?? ''),
          amount: Number(args.amount),
          recipient: args.recipient ? String(args.recipient) : undefined,
          paymentAlreadySettled: options.paymentAlreadySettled,
          paymentTxId: options.paymentTxId,
          paymentStatus: options.paymentStatus,
        });
        result = {
          data: {
            report: research.report,
            payment: research.payment,
          },
          isError: false,
        };
        break;
      }

      default:
        result = { data: { error: `Unknown tool: ${name}` }, isError: true };
    }
  } catch (error) {
    result = {
      data: {
        error: error instanceof Error ? error.message : 'Tool execution failed',
      },
      isError: true,
    };
  }

  return attachReceipt(backend, name, args, result, options);
}

export async function attachReceiptToResult(
  name: McpToolName,
  args: Record<string, unknown>,
  result: McpToolResult,
  options: ExecuteMcpToolOptions,
): Promise<McpToolResultWithReceipt> {
  const backend = await getBackend();
  return attachReceipt(backend, name, args, result, options);
}

async function attachReceipt(
  backend: BackendModules,
  name: McpToolName,
  args: Record<string, unknown>,
  result: McpToolResult,
  options: ExecuteMcpToolOptions,
): Promise<McpToolResultWithReceipt> {
  if (result.isError || !options.paymentTxId) {
    return result;
  }

  try {
    const resultHash = backend.hashResult(result.data);
    const hcsTxId = await backend.logReceiptToHCS({
      tool: name,
      paymentTxId: options.paymentTxId,
      payer: options.payer,
      args,
      resultHash,
    });
    return {
      ...result,
      receipt: { hcsTxId, resultHash },
    };
  } catch (error) {
    console.error('HCS receipt logging failed:', error);
    return result;
  }
}
