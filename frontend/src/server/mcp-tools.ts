import { createHash } from 'node:crypto';
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

interface CoreBackendModules {
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
}

interface HcsBackendModules {
  logReceiptToHCS: (payload: {
    tool: string;
    paymentTxId: string;
    payer?: string;
    args?: Record<string, unknown>;
    resultHash: string;
  }) => Promise<string>;
}

const CORE_BACKEND_MODULES = [
  'graph/compare.js',
  'graph/client.js',
  'graph/config.js',
  'hedera/client.js',
  'src/purchase-research.js',
] as const;

let backendDistPath: string | null = null;
let coreBackendPromise: Promise<CoreBackendModules> | null = null;
let hcsBackendPromise: Promise<HcsBackendModules | null> | null = null;

function importFromDist(dist: string, modulePath: string) {
  return import(/* webpackIgnore: true */ pathToFileURL(path.join(dist, modulePath)).href);
}

async function loadCoreBackend(): Promise<CoreBackendModules> {
  let dist: string;
  try {
    dist = resolveBackendDist(import.meta.url);
  } catch (error) {
    coreBackendPromise = null;
    throw error;
  }

  backendDistPath = dist;

  try {
    const [compare, client, config, hedera, research] = await Promise.all(
      CORE_BACKEND_MODULES.map((modulePath) => importFromDist(dist, modulePath)),
    );

    return {
      compareMultipleProtocols: compare.compareMultipleProtocols,
      getMarketSummary: compare.getMarketSummary,
      getProtocol: client.getProtocol,
      listProtocols: config.listProtocols,
      getBalance: hedera.getBalance,
      transferHBAR: hedera.transferHBAR,
      purchaseResearch: research.purchaseResearch,
    };
  } catch (error) {
    coreBackendPromise = null;
    backendDistPath = null;
    const message = error instanceof Error ? error.message : 'Unknown backend import error';
    throw new Error(`Failed to load ChainPilot backend from ${dist}: ${message}`);
  }
}

function getCoreBackend(): Promise<CoreBackendModules> {
  if (!coreBackendPromise) {
    coreBackendPromise = loadCoreBackend();
  }
  return coreBackendPromise;
}

async function getHcsBackend(): Promise<HcsBackendModules | null> {
  if (!hcsBackendPromise) {
    hcsBackendPromise = (async () => {
      try {
        const dist = backendDistPath ?? resolveBackendDist(import.meta.url);
        const hcs = await importFromDist(dist, 'hedera/hcs.js');
        return { logReceiptToHCS: hcs.logReceiptToHCS };
      } catch (error) {
        console.error('HCS module unavailable:', error);
        return null;
      }
    })();
  }
  return hcsBackendPromise;
}

function hashResult(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
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
  const backend = await getCoreBackend();

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

  return attachReceipt(name, args, result, options);
}

export async function attachReceiptToResult(
  name: McpToolName,
  args: Record<string, unknown>,
  result: McpToolResult,
  options: ExecuteMcpToolOptions,
): Promise<McpToolResultWithReceipt> {
  return attachReceipt(name, args, result, options);
}

async function attachReceipt(
  name: McpToolName,
  args: Record<string, unknown>,
  result: McpToolResult,
  options: ExecuteMcpToolOptions,
): Promise<McpToolResultWithReceipt> {
  if (result.isError || !options.paymentTxId) {
    return result;
  }

  try {
    const hcs = await getHcsBackend();
    if (!hcs) {
      return result;
    }

    const resultHash = hashResult(result.data);
    const hcsTxId = await hcs.logReceiptToHCS({
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
