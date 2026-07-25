'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MCP_TOOL_NAMES } from '@/lib/mcp-definitions';
import { Settings, Shield, Zap } from 'lucide-react';

export default function SettingsPage() {
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
              The frontend loads credentials from the parent <code className="rounded bg-white/10 px-1">.env</code> file
              in the ChainPilot repository root.
            </p>
            <ul className="space-y-2 text-muted">
              <li>THE_GRAPH_API_KEY</li>
              <li>HEDERA_ACCOUNT_ID</li>
              <li>HEDERA_PRIVATE_KEY</li>
              <li>RESEARCH_PAYMENT_RECIPIENT</li>
              <li>RESEARCH_PRICE_HBAR</li>
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
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="primary">The Graph</Badge>
            <Badge variant="secondary">Hedera Testnet</Badge>
            <Badge variant="accent">MCP Server</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-accent" />
              Registered MCP Tools ({MCP_TOOL_NAMES.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MCP_TOOL_NAMES.map((tool) => (
                <Badge key={tool} variant="default">{tool}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
