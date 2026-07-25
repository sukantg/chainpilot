import { runDashboardMcpTool } from '@/app/actions/mcp-actions';
import type { McpToolName } from '@/lib/mcp-definitions';

interface McpResponse<T> {
  data: T;
  executionTimeMs: number;
  isError: boolean;
  tool?: string;
}

function extractError(data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error: unknown }).error;
    if (typeof message === 'string') return message;
  }
  return 'Tool execution failed';
}

/** Dashboard MCP calls — server actions bypass the public x402 gate. */
async function callMcpTool<T>(
  tool: McpToolName,
  args: Record<string, unknown> = {},
): Promise<McpResponse<T>> {
  const body = await runDashboardMcpTool(tool, args);

  if (body.isError) {
    throw new Error(extractError(body.data));
  }

  return body as McpResponse<T>;
}

export async function fetchPublicMcpInfo() {
  const res = await fetch('/api/mcp', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load MCP info');
  return res.json() as Promise<{
    tools: string[];
    x402: boolean;
    facilitator: string | null;
    payTo: string | null;
  }>;
}

export const api = {
  listProtocols: () =>
    callMcpTool<{ protocols: Array<{ id: string; name: string; supported: boolean }> }>(
      'list_protocols',
    ),
  getProtocol: (protocol: string) =>
    callMcpTool<{ name: string; tvl: string; volume: string; transactionCount: string }>(
      'get_protocol',
      { protocol },
    ),
  compareMultiple: (protocols: string[]) =>
    callMcpTool('compare_multiple_protocols', { protocols }),
  marketSummary: () => callMcpTool('market_summary'),
  walletBalance: () =>
    callMcpTool<{ accountId: string; hbar: string; tinybars: string }>('wallet_balance'),
  transferHbar: (recipient: string, amount: number) =>
    callMcpTool('transfer_hbar', { recipient, amount }),
  purchaseResearch: (protocolA: string, protocolB: string, amount: number, recipient?: string) =>
    callMcpTool<{ report: string; payment: Record<string, unknown> }>('purchase_research', {
      protocolA,
      protocolB,
      amount,
      ...(recipient ? { recipient } : {}),
    }),
  runTool: callMcpTool,
};
