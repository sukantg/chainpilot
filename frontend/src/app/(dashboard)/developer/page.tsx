'use client';

import { Header } from '@/components/layout/header';
import { McpToolCatalog } from '@/components/shared/mcp-tool-catalog';
import { McpToolPricingBadge } from '@/components/shared/mcp-tool-pricing-badge';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/input';
import { MCP_TOOL_DEFINITIONS, type McpToolName } from '@/lib/mcp-definitions';
import { getToolTier } from '@/lib/mcp-pricing';
import { api, fetchPublicMcpInfo } from '@/lib/api';
import { ArrowDown, Coins, Play, Sparkles, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DeveloperPage() {
  const [tool, setTool] = useState<McpToolName>('list_protocols');
  const [argsJson, setArgsJson] = useState(
    JSON.stringify(MCP_TOOL_DEFINITIONS.list_protocols.exampleArgs, null, 2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [x402Enabled, setX402Enabled] = useState(false);
  const [toolFilter, setToolFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [response, setResponse] = useState<{
    data: unknown;
    executionTimeMs: number;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    void fetchPublicMcpInfo()
      .then((info) => setX402Enabled(info.x402))
      .catch(() => setX402Enabled(false));
  }, []);

  function onToolChange(next: McpToolName) {
    setTool(next);
    setArgsJson(JSON.stringify(MCP_TOOL_DEFINITIONS[next].exampleArgs, null, 2));
    setResponse(null);
    setError(null);
  }

  async function execute() {
    setLoading(true);
    setError(null);
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>;
      const res = await api.runTool(tool, args);
      setResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  }

  const selectedTier = getToolTier(tool);

  return (
    <>
      <Header
        title="Developer Console"
        description="Execute ChainPilot MCP tools and inspect live request/response payloads."
        badge="MCP Tools"
      />

      {x402Enabled && (
        <Card className="mb-6 border-accent/30 bg-accent/5">
          <CardContent className="pt-6 text-sm text-muted">
            <strong className="text-foreground">x402 is enabled.</strong> External agents calling{' '}
            <code className="rounded bg-white/10 px-1">POST /api/mcp</code> must pay for premium
            tools. This console runs tools directly on the server so the dashboard keeps working.
            Use <code className="rounded bg-white/10 px-1">npm run agent:buy</code> to test the
            public x402 API.
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'free', 'paid'] as const).map((filter) => (
          <Button
            key={filter}
            variant={toolFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolFilter(filter)}
          >
            {filter === 'all' && 'All tools'}
            {filter === 'free' && (
              <>
                <Sparkles className="h-4 w-4" />
                Free only
              </>
            )}
            {filter === 'paid' && (
              <>
                <Coins className="h-4 w-4" />
                Paid only
              </>
            )}
          </Button>
        ))}
      </div>

      {toolFilter === 'all' ? (
        <div className="mb-6">
          <McpToolCatalog onSelect={onToolChange} selectedTool={tool} developerMode />
        </div>
      ) : (
        <div className="mb-6">
          <McpToolCatalog
            onSelect={onToolChange}
            selectedTool={tool}
            tier={toolFilter}
            developerMode
          />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-5 w-5 text-accent" />
            MCP Tool Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label>Selected tool</Label>
              <Badge
                variant={selectedTier === 'paid' ? 'accent' : 'success'}
                className="font-mono"
              >
                {tool}
              </Badge>
              <McpToolPricingBadge tool={tool} developerMode />
            </div>
            <p className="text-xs text-muted">{MCP_TOOL_DEFINITIONS[tool].description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="args-json">Request JSON</Label>
            <textarea
              id="args-json"
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              spellCheck={false}
            />
          </div>

          <Button onClick={execute} disabled={loading}>
            <Play className="h-4 w-4" />
            {loading ? 'Executing…' : 'Execute Tool'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} onRetry={execute} />}

      {response && (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Response JSON
                <div className="flex items-center gap-2">
                  <Badge variant={response.isError ? 'danger' : 'success'}>
                    {response.isError ? 'Error' : 'Success'}
                  </Badge>
                  <Badge variant="accent">{response.executionTimeMs}ms</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-xl bg-black/30 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
