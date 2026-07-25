/** Lightweight x402 config — safe to import from server actions without loading @x402/core. */
export function isX402Enabled(): boolean {
  return Boolean(process.env.FACILITATOR_URL && process.env.X402_PAY_TO);
}
