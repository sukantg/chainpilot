import { MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';

/** Price in whole HBAR units for x402 pay-per-use tools. */
export const TOOL_PRICE_HBAR: Partial<Record<McpToolName, number>> = {
  get_protocol: 0.1,
  compare_multiple_protocols: 0.5,
  market_summary: 0.5,
  purchase_research: 1,
};

export const FREE_TOOLS = new Set<McpToolName>([
  'hello',
  'list_protocols',
  'wallet_balance',
  'transfer_hbar',
]);

export const FREE_TOOL_NAMES = MCP_TOOL_NAMES.filter((tool) => FREE_TOOLS.has(tool));

export type ToolTier = 'free' | 'paid';

export function getToolPriceHbar(tool: McpToolName): number | undefined {
  return TOOL_PRICE_HBAR[tool];
}

export function isPaidTool(tool: McpToolName): boolean {
  return !FREE_TOOLS.has(tool) && getToolPriceHbar(tool) !== undefined;
}

export const PAID_TOOL_NAMES = MCP_TOOL_NAMES.filter((tool) => isPaidTool(tool));

export function getToolTier(tool: McpToolName): ToolTier {
  return isPaidTool(tool) ? 'paid' : 'free';
}

export function formatToolPrice(tool: McpToolName): string {
  const price = getToolPriceHbar(tool);
  return price !== undefined ? `${price} ℏ` : 'Free';
}

export function hbarToTinybars(hbar: number): string {
  return Math.round(hbar * 100_000_000).toString();
}
