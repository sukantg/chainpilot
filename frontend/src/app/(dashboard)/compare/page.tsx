'use client';

import { ProtocolComparisonChart, toChartData } from '@/components/charts/comparison-charts';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Label, Select } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCount, formatUsd } from '@/lib/utils';
import { GitCompare, Trophy } from 'lucide-react';
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

export default function ComparePage() {
  const [protocols, setProtocols] = useState<Array<{ id: string; name: string }>>([]);
  const [protocolA, setProtocolA] = useState('uniswap');
  const [protocolB, setProtocolB] = useState('aave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  useEffect(() => {
    void api.listProtocols().then((res) => setProtocols(res.data.protocols));
  }, []);

  async function compare() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareMultiple([protocolA, protocolB]);
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
        title="Compare Protocols"
        description="Head-to-head live metrics comparison across two DeFi protocols."
        badge="Live Comparison"
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3 md:items-end">
          <div className="space-y-2">
            <Label>Protocol A</Label>
            <Select value={protocolA} onChange={(e) => setProtocolA(e.target.value)}>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Protocol B</Label>
            <Select value={protocolB} onChange={(e) => setProtocolB(e.target.value)}>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <Button onClick={compare} disabled={loading || protocolA === protocolB}>
            <GitCompare className="h-4 w-4" />
            {loading ? 'Comparing…' : 'Compare'}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} onRetry={compare} />}

      {!result && !loading && !error && (
        <EmptyState
          icon={GitCompare}
          title="Ready to compare"
          description="Select two protocols and click Compare to view live metrics side-by-side."
          action={<Button onClick={compare}>Compare now</Button>}
        />
      )}

      {loading && <PageLoader />}

      {result && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted">
                    <th className="pb-3 pr-4">Metric</th>
                    {result.protocols.map((p) => (
                      <th key={p.name} className="pb-3 pr-4">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'TVL', key: 'totalValueLockedUSD' as const, leader: result.leaders.tvl, fmt: formatUsd },
                    { label: 'Volume', key: 'totalVolumeUSD' as const, leader: result.leaders.volume, fmt: formatUsd },
                    { label: 'Transaction Count', key: 'txCount' as const, leader: result.leaders.transactions, fmt: formatCount },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{row.label}</td>
                      {result.protocols.map((p) => (
                        <td key={p.name} className="py-3 pr-4">
                          <span>{row.fmt(p[row.key])}</span>
                          {p.name === row.leader && (
                            <Badge variant="success" className="ml-2">
                              <Trophy className="mr-1 h-3 w-3" />
                              Winner
                            </Badge>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <ProtocolComparisonChart data={toChartData(result.protocols)} />

          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted leading-relaxed">{result.recommendation}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
