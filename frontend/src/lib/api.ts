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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<McpResponse<T>> {
  const res = await fetch(url, init);
  const body = (await res.json()) as McpResponse<T> & { error?: string };

  if (!res.ok) {
    throw new Error(body.error ?? extractError(body.data) ?? 'Request failed');
  }

  if (body.isError) {
    throw new Error(extractError(body.data));
  }

  return body;
}

export async function callMcpTool<T>(
  tool: McpToolName,
  args: Record<string, unknown> = {},
): Promise<{ data: T; executionTimeMs: number; isError: boolean }> {
  return fetchJson<T>('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
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
};
