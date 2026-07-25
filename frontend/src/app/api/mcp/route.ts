import { NextResponse } from 'next/server';
import { executeMcpTool } from '@/server/mcp-tools';
import { MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';

export async function POST(request: Request) {
  const start = performance.now();
  const body = await request.json();
  const tool = body.tool as McpToolName;
  const args = (body.args ?? {}) as Record<string, unknown>;

  if (!MCP_TOOL_NAMES.includes(tool)) {
    return NextResponse.json(
      { error: `Unknown tool: ${tool}`, executionTimeMs: 0, isError: true },
      { status: 400 },
    );
  }

  const result = await executeMcpTool(tool, args);
  const executionTimeMs = Math.round(performance.now() - start);

  return NextResponse.json({
    data: result.data,
    isError: result.isError,
    executionTimeMs,
    tool,
    args,
  });
}

export async function GET() {
  return NextResponse.json({
    tools: MCP_TOOL_NAMES,
  });
}
