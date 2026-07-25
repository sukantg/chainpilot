'use client';

import { ProtocolComparisonChart, toChartData } from '@/components/charts/comparison-charts';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn, formatCount, formatUsd } from '@/lib/utils';
import { BarChart3, Check, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CompareResult {
  protocols: Array<{
    name: string;
    totalValueLockedUSD: string;
    totalVolumeUSD: string;
    txCount: string;
  }>;
  leaders: { tvl: string; volume: string; transactions: string };
  recommendation: string;
}

export default function CompareMultiplePage() {
  const [available, setAvailable] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<string[]>(['uniswap', 'aave', 'curve']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  useEffect(() => {
    void api.listProtocols().then((res) => setAvailable(res.data.protocols));
  }, []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function compare() {
    if (selected.length < 2) {
      setError('Select at least 2 protocols');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareMultiple(selected);
      if (res.isError) throw new Error(JSON.stringify(res.data));
      setResult(res.data as CompareResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Compare Multiple"
        description="Multi-protocol rankings with live leaders and deterministic recommendations."
        badge="Rankings"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Select Protocols</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {available.map((p) => {
              const active = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    active
                      ? 'border-primary/40 bg-primary/15 text-blue-200'
                      : 'border-white/10 bg-white/5 text-muted hover:border-white/20',
                  )}
                >
                  {active && <Check className="h-4 w-4" />}
                  {p.name}
                </button>
              );
            })}
          </div>
          <Button onClick={compare} disabled={loading || selected.length < 2}>
            <BarChart3 className="h-4 w-4" />
            {loading ? 'Analyzing…' : 'Compare Selected'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} onRetry={compare} />}
      {loading && <PageLoader />}

      {!result && !loading && !error && (
        <EmptyState
          icon={BarChart3}
          title="Select protocols to compare"
          description="Choose two or more protocols to generate live rankings and charts."
        />
      )}

      {result && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <LeaderCard label="Highest TVL" value={result.leaders.tvl} />
            <LeaderCard label="Highest Volume" value={result.leaders.volume} />
            <LeaderCard label="Highest Transactions" value={result.leaders.transactions} />
            <LeaderCard label="Best Overall" value={result.recommendation.split(' ')[0]} highlight />
          </div>

          <Card>
            <CardHeader><CardTitle>Rankings</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted">
                    <th className="pb-3 pr-4">Protocol</th>
                    <th className="pb-3 pr-4">TVL</th>
                    <th className="pb-3 pr-4">Volume</th>
                    <th className="pb-3 pr-4">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.protocols.map((p) => (
                    <tr key={p.name} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{p.name}</td>
                      <td className="py-3 pr-4">
                        {formatUsd(p.totalValueLockedUSD)}
                        {p.name === result.leaders.tvl && <Badge variant="primary" className="ml-2">#1</Badge>}
                      </td>
                      <td className="py-3 pr-4">
                        {formatUsd(p.totalVolumeUSD)}
                        {p.name === result.leaders.volume && <Badge variant="secondary" className="ml-2">#1</Badge>}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCount(p.txCount)}
                        {p.name === result.leaders.transactions && <Badge variant="accent" className="ml-2">#1</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <ProtocolComparisonChart data={toChartData(result.protocols)} />

          <Card>
            <CardHeader><CardTitle>Recommendation</CardTitle></CardHeader>
            <CardContent><p className="text-muted leading-relaxed">{result.recommendation}</p></CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function LeaderCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/30' : undefined}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          {highlight ? <Crown className="h-4 w-4 text-primary" /> : null}
          {label}
        </div>
        <p className="mt-2 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
