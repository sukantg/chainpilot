'use client';

import { getMcpInfo } from '@/app/actions/mcp-actions';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FREE_TOOLS, TOOL_PRICE_HBAR } from '@/lib/mcp-pricing';
import { MCP_TOOL_NAMES } from '@/lib/mcp-definitions';
import { Settings, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [mcpInfo, setMcpInfo] = useState<Awaited<ReturnType<typeof getMcpInfo>> | null>(null);

  useEffect(() => {
    void getMcpInfo().then(setMcpInfo);
  }, []);

  return (
    <>
      <Header
        title="Settings"
        description="ChainPilot configuration and integration overview."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-5 w-5" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted">
              Credentials load from the repo root <code className="rounded bg-white/10 px-1">.env</code>{' '}
              locally, or Vercel Environment Variables in production.
            </p>
            <p className="font-medium text-foreground">Core</p>
            <ul className="space-y-2 text-muted">
              <li>THE_GRAPH_API_KEY</li>
              <li>HEDERA_ACCOUNT_ID</li>
              <li>HEDERA_PRIVATE_KEY</li>
              <li>RESEARCH_PAYMENT_RECIPIENT</li>
              <li>RESEARCH_PRICE_HBAR</li>
            </ul>
            <p className="font-medium text-foreground">x402 (public API)</p>
            <ul className="space-y-2 text-muted">
              <li>FACILITATOR_URL</li>
              <li>FACILITATOR_ACCOUNT_ID</li>
              <li>FACILITATOR_PRIVATE_KEY (facilitator host only)</li>
              <li>X402_PAY_TO</li>
              <li>HCS_RECEIPT_TOPIC_ID</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">The Graph</Badge>
              <Badge variant="secondary">Hedera Testnet</Badge>
              <Badge variant="accent">MCP Server</Badge>
              {mcpInfo?.x402 && <Badge variant="success">x402 enabled</Badge>}
            </div>
            {mcpInfo && (
              <dl className="space-y-2 text-sm text-muted">
                <div className="flex justify-between gap-4">
                  <dt>Public API x402</dt>
                  <dd className="text-foreground">{mcpInfo.x402 ? 'Active' : 'Off'}</dd>
                </div>
                {mcpInfo.facilitator && (
                  <div className="flex justify-between gap-4">
                    <dt>Facilitator</dt>
                    <dd className="truncate text-foreground">{mcpInfo.facilitator}</dd>
                  </div>
                )}
                {mcpInfo.payTo && (
                  <div className="flex justify-between gap-4">
                    <dt>Pay to</dt>
                    <dd className="text-foreground">{mcpInfo.payTo}</dd>
                  </div>
                )}
              </dl>
            )}
            <p className="text-xs text-muted">
              Dashboard pages use server-side tool execution and are not gated by x402. External
              agents must pay via <code className="rounded bg-white/10 px-1">POST /api/mcp</code>.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-accent" />
              MCP Tools ({MCP_TOOL_NAMES.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {MCP_TOOL_NAMES.map((tool) => {
                const price = TOOL_PRICE_HBAR[tool];
                const isFree = FREE_TOOLS.has(tool);
                return (
                  <Badge key={tool} variant={isFree ? 'default' : 'accent'}>
                    {tool}
                    {!isFree && price !== undefined ? ` · ${price} ℏ API` : ''}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
