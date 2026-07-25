'use client';

import { Header } from '@/components/layout/header';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/input';
import { MCP_TOOL_DEFINITIONS, MCP_TOOL_NAMES, type McpToolName } from '@/lib/mcp-definitions';
import { ArrowDown, Play, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function DeveloperPage() {
  const [tool, setTool] = useState<McpToolName>('list_protocols');
  const [argsJson, setArgsJson] = useState(JSON.stringify(MCP_TOOL_DEFINITIONS.list_protocols.exampleArgs, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    data: unknown;
    executionTimeMs: number;
    isError: boolean;
  } | null>(null);

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
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, args }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Request failed');
      setResponse(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Developer Console"
        description="Execute any ChainPilot MCP tool and inspect live request/response payloads."
        badge="MCP Tools"
      />

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
            <Select id="tool-select" value={tool} onChange={(e) => onToolChange(e.target.value as McpToolName)}>
              {MCP_TOOL_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
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
