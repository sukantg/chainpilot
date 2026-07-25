'use client';

import { Header } from '@/components/layout/header';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/input';
import { MCP_TOOL_DEFINITIONS, MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';
import { getToolPriceHbar, isPaidTool } from '@/lib/mcp-pricing';
import { api, fetchPublicMcpInfo } from '@/lib/api';
import { ArrowDown, Play, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DeveloperPage() {
  const [tool, setTool] = useState<McpToolName>('list_protocols');
  const [argsJson, setArgsJson] = useState(
    JSON.stringify(MCP_TOOL_DEFINITIONS.list_protocols.exampleArgs, null, 2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [x402Enabled, setX402Enabled] = useState(false);
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

  const priceHbar = getToolPriceHbar(tool);

  return (
    <>
      <Header
        title="Developer Console"
        description="Execute any ChainPilot MCP tool and inspect live request/response payloads."
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-5 w-5 text-accent" />
            MCP Tool Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tool-select">Tool</Label>
            <Select
              id="tool-select"
              value={tool}
              onChange={(e) => onToolChange(e.target.value as McpToolName)}
            >
              {MCP_TOOL_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                  {isPaidTool(name) ? ` (${getToolPriceHbar(name)} ℏ via API)` : ''}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted">{MCP_TOOL_DEFINITIONS[tool].description}</p>
              {priceHbar !== undefined && (
                <Badge variant="accent">{priceHbar} ℏ on public API</Badge>
              )}
            </div>
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
