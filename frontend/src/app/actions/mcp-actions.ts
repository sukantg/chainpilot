'use server';

import { MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';
import { executeMcpTool } from '@/server/mcp-tools';
import { isX402Enabled } from '@/server/x402-config';

export interface DashboardMcpResponse {
  data: unknown;
  isError: boolean;
  executionTimeMs: number;
  tool: McpToolName;
}

/** Dashboard-only MCP execution — bypasses x402 gate on POST /api/mcp. */
export async function runDashboardMcpTool(
  tool: McpToolName,
  args: Record<string, unknown> = {},
): Promise<DashboardMcpResponse> {
  if (!MCP_TOOL_NAMES.includes(tool)) {
    return {
      data: { error: `Unknown tool: ${tool}` },
      isError: true,
      executionTimeMs: 0,
      tool,
    };
  }

  try {
    const start = performance.now();
    const result = await executeMcpTool(tool, args);
    return {
      data: result.data,
      isError: result.isError,
      executionTimeMs: Math.round(performance.now() - start),
      tool,
    };
  } catch (error) {
    return {
      data: {
        error: error instanceof Error ? error.message : 'Tool execution failed',
      },
      isError: true,
      executionTimeMs: 0,
      tool,
    };
  }
}

export async function getMcpInfo() {
  return {
    tools: [...MCP_TOOL_NAMES],
    x402: isX402Enabled(),
    facilitator: process.env.FACILITATOR_URL ?? null,
    payTo: process.env.X402_PAY_TO ?? null,
  };
}
