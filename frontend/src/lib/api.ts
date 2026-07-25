import type { McpToolName } from '@/lib/mcp-definitions';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? 'Request failed');
  }
  return body as T;
}

export async function callMcpTool<T>(
  tool: McpToolName,
  args: Record<string, unknown> = {},
): Promise<{ data: T; executionTimeMs: number; isError: boolean }> {
  return fetchJson('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
}

export const api = {
  listProtocols: () => callMcpTool<{ protocols: Array<{ id: string; name: string; supported: boolean }> }>('list_protocols'),
  getProtocol: (protocol: string) => callMcpTool<{ name: string; tvl: string; volume: string; transactionCount: string }>('get_protocol', { protocol }),
  compareMultiple: (protocols: string[]) => callMcpTool('compare_multiple_protocols', { protocols }),
  marketSummary: () => callMcpTool('market_summary'),
  walletBalance: () => callMcpTool<{ accountId: string; hbar: string; tinybars: string }>('wallet_balance'),
  transferHbar: (recipient: string, amount: number) => callMcpTool('transfer_hbar', { recipient, amount }),
  purchaseResearch: (protocolA: string, protocolB: string, amount: number, recipient?: string) =>
    callMcpTool<{ report: string; payment: Record<string, unknown> }>('purchase_research', {
      protocolA,
      protocolB,
      amount,
      ...(recipient ? { recipient } : {}),
    }),
};
