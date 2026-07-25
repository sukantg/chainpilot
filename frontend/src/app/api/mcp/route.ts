import { NextResponse } from 'next/server';
import { attachReceiptToResult, executeMcpTool } from '@/server/mcp-tools';
import { isX402Enabled } from '@/server/x402-config';
import {
  settleMcpPayment,
  verifyMcpPayment,
} from '@/server/x402-server';
import { getToolPriceHbar } from '@/lib/mcp-pricing';
import { MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';

export const maxDuration = 60;

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

  const payment = await verifyMcpPayment(request, { tool, args }, tool);

  if (payment.kind === 'error') {
    return NextResponse.json(payment.body, {
      status: payment.status,
      headers: payment.headers,
    });
  }

  const executeOptions =
    payment.kind === 'verified'
      ? {
          paymentAlreadySettled: tool === 'purchase_research',
          paymentTxId: undefined as string | undefined,
          paymentStatus: undefined as string | undefined,
        }
      : {};

  if (payment.kind === 'verified' && tool === 'purchase_research' && !args.amount) {
    args.amount = getToolPriceHbar(tool) ?? 1;
  }

  let result = await executeMcpTool(tool, args, executeOptions);
  const executionTimeMs = Math.round(performance.now() - start);

  if (result.isError) {
    return NextResponse.json({
      data: result.data,
      isError: true,
      executionTimeMs,
      tool,
      args,
    });
  }

  const responsePayload = {
    data: result.data,
    isError: false,
    executionTimeMs,
    tool,
    args,
    x402: isX402Enabled(),
  };

  if (payment.kind !== 'verified') {
    return NextResponse.json(responsePayload);
  }

  const settle = await settleMcpPayment(payment, responsePayload);

  if (!settle.success) {
    return NextResponse.json(settle.response.body ?? { error: 'Settlement failed' }, {
      status: settle.response.status,
      headers: settle.response.headers,
    });
  }

  result = await attachReceiptToResult(tool, args, result, {
    paymentTxId: settle.transaction,
    payer: settle.payer,
    paymentStatus: 'SUCCESS',
    paymentAlreadySettled: executeOptions.paymentAlreadySettled,
  });

  return NextResponse.json(
    {
      ...responsePayload,
      receipt: result.receipt,
      payment: {
        transactionId: settle.transaction,
        payer: settle.payer,
        network: settle.network,
        amount: settle.amount,
      },
    },
    { headers: settle.headers },
  );
}

export async function GET() {
  return NextResponse.json({
    tools: MCP_TOOL_NAMES,
    x402: isX402Enabled(),
    facilitator: process.env.FACILITATOR_URL ?? null,
    payTo: process.env.X402_PAY_TO ?? null,
  });
}
