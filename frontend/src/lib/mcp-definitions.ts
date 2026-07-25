export const MCP_TOOL_NAMES = [
  'hello',
  'list_protocols',
  'get_protocol',
  'compare_multiple_protocols',
  'market_summary',
  'wallet_balance',
  'transfer_hbar',
  'purchase_research',
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export const MCP_TOOL_DEFINITIONS: Record<
  McpToolName,
  { description: string; exampleArgs: Record<string, unknown> }
> = {
  hello: { description: 'Returns a greeting from ChainPilot', exampleArgs: {} },
  list_protocols: {
    description: 'Returns all supported DeFi protocols',
    exampleArgs: {},
  },
  get_protocol: {
    description: 'Fetch live metrics for a DeFi protocol',
    exampleArgs: { protocol: 'uniswap' },
  },
  compare_multiple_protocols: {
    description: 'Compare multiple DeFi protocols by TVL, volume, and transaction count',
    exampleArgs: { protocols: ['uniswap', 'aave', 'curve'] },
  },
  market_summary: {
    description: 'Returns an overall market summary across all supported DeFi protocols',
    exampleArgs: {},
  },
  wallet_balance: {
    description: 'Returns the HBAR balance of the configured Hedera Testnet wallet',
    exampleArgs: {},
  },
  transfer_hbar: {
    description: 'Transfer HBAR on Hedera Testnet to a recipient account',
    exampleArgs: { recipient: '0.0.3', amount: 1 },
  },
  purchase_research: {
    description: 'Pay for and receive a markdown protocol comparison research report',
    exampleArgs: { protocolA: 'uniswap', protocolB: 'aave', amount: 1 },
  },
};
