import {
  HTTPFacilitatorClient,
  x402HTTPResourceServer,
  x402ResourceServer,
  type HTTPProcessResult,
  type HTTPRequestContext,
  type ProcessSettleResultResponse,
} from '@x402/core/server';
import { ExactHederaScheme } from '@x402/hedera/exact/server';
import { HEDERA_TESTNET_CAIP2 } from '@x402/hedera';
import type { McpToolName } from '@/lib/mcp-definitions';
import {
  getToolPriceHbar,
  hbarToTinybars,
  isPaidTool,
} from '@/lib/mcp-pricing';
import { NextRequestAdapter } from './next-request-adapter';

let httpServerPromise: Promise<x402HTTPResourceServer> | null = null;

export function isX402Enabled(): boolean {
  return Boolean(process.env.FACILITATOR_URL && process.env.X402_PAY_TO);
}

function getPayTo(): string {
  const payTo = process.env.X402_PAY_TO;
  if (!payTo) {
    throw new Error('X402_PAY_TO is not configured');
  }
  return payTo;
}

function getFacilitatorUrl(): string {
  const url = process.env.FACILITATOR_URL;
  if (!url) {
    throw new Error('FACILITATOR_URL is not configured');
  }
  return url;
}

async function createHttpServer(): Promise<x402HTTPResourceServer> {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: getFacilitatorUrl(),
  });

  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    HEDERA_TESTNET_CAIP2,
    new ExactHederaScheme(),
  );

  const httpServer = new x402HTTPResourceServer(resourceServer, {
    'POST /api/mcp': {
      accepts: {
        scheme: 'exact',
        network: HEDERA_TESTNET_CAIP2,
        payTo: getPayTo(),
        price: (context: HTTPRequestContext) => {
          const body = context.adapter.getBody?.() as { tool?: McpToolName } | undefined;
          const tool = body?.tool;
          if (!tool || !isPaidTool(tool)) {
            return { amount: '0', asset: '0.0.0' };
          }
          const hbar = getToolPriceHbar(tool) ?? 0;
          return { amount: hbarToTinybars(hbar), asset: '0.0.0' };
        },
        maxTimeoutSeconds: 120,
      },
      description: 'ChainPilot MCP tool execution',
      mimeType: 'application/json',
      unpaidResponseBody: (context) => {
        const body = context.adapter.getBody?.() as { tool?: McpToolName } | undefined;
        return {
          contentType: 'application/json',
          body: {
            error: 'Payment required',
            tool: body?.tool,
            priceHbar: body?.tool ? getToolPriceHbar(body.tool) : undefined,
            pricing: 'https://github.com/sukantg/chainpilot#mcp-tools',
          },
        };
      },
    },
  });

  await httpServer.initialize();
  return httpServer;
}

async function getHttpServer(): Promise<x402HTTPResourceServer> {
  if (!httpServerPromise) {
    httpServerPromise = createHttpServer();
  }
  return httpServerPromise;
}

export interface McpPaymentGateResult {
  kind: 'free';
}

export interface McpPaymentVerifiedResult {
  kind: 'verified';
  paymentPayload: NonNullable<
    Extract<HTTPProcessResult, { type: 'payment-verified' }>['paymentPayload']
  >;
  paymentRequirements: NonNullable<
    Extract<HTTPProcessResult, { type: 'payment-verified' }>['paymentRequirements']
  >;
  declaredExtensions?: Record<string, unknown>;
  transportContext: HTTPRequestContext;
}

export type McpPaymentResult = McpPaymentGateResult | McpPaymentVerifiedResult;

export async function verifyMcpPayment(
  request: Request,
  body: Record<string, unknown>,
  tool: McpToolName,
): Promise<
  | McpPaymentResult
  | { kind: 'error'; status: number; headers: Record<string, string>; body: unknown }
> {
  if (!isX402Enabled() || !isPaidTool(tool)) {
    return { kind: 'free' };
  }

  const url = new URL(request.url);
  const adapter = new NextRequestAdapter(request, body, url);
  const paymentHeader =
    adapter.getHeader('payment-signature') ?? adapter.getHeader('PAYMENT-SIGNATURE');

  const context: HTTPRequestContext = {
    adapter,
    path: url.pathname,
    method: request.method,
    paymentHeader,
  };

  const httpServer = await getHttpServer();
  const result = await httpServer.processHTTPRequest(context);

  if (result.type === 'no-payment-required') {
    return { kind: 'free' };
  }

  if (result.type === 'payment-error') {
    return {
      kind: 'error',
      status: result.response.status,
      headers: result.response.headers,
      body: result.response.body ?? {},
    };
  }

  return {
    kind: 'verified',
    paymentPayload: result.paymentPayload,
    paymentRequirements: result.paymentRequirements,
    declaredExtensions: result.declaredExtensions,
    transportContext: context,
  };
}

export async function settleMcpPayment(
  verified: McpPaymentVerifiedResult,
  responseBody: unknown,
): Promise<ProcessSettleResultResponse> {
  const httpServer = await getHttpServer();
  const bodyText = JSON.stringify(responseBody);
  return httpServer.processSettlement(
    verified.paymentPayload,
    verified.paymentRequirements,
    verified.declaredExtensions,
    {
      request: verified.transportContext,
      responseBody: Buffer.from(bodyText),
      responseHeaders: { 'Content-Type': 'application/json' },
    },
  );
}
