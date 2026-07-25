import { NextResponse } from 'next/server';
import { isX402Enabled } from '@/server/x402-config';

export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    ok: true,
    x402: isX402Enabled(),
    hasGraphKey: Boolean(process.env.THE_GRAPH_API_KEY),
    hasHedera: Boolean(process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY),
  });
}
