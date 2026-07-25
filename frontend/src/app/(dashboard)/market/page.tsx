'use client';

import { RankingBarChart } from '@/components/charts/comparison-charts';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/shared/kpi-card';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCount, formatUsd } from '@/lib/utils';
import { Activity, BarChart3, Crown, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MarketSummary {
  protocolsAnalyzed: number;
  highestTvl: { name: string; value: string };
  highestVolume: { name: string; value: string };
  highestTransactionCount: { name: string; value: string };
  rankingByTvl: Array<{ rank: number; name: string; value: string }>;
  rankingByVolume: Array<{ rank: number; name: string; value: string }>;
  rankingByTransactions: Array<{ rank: number; name: string; value: string }>;
  overallStrongestProtocol: { name: string };
}

export default function MarketPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MarketSummary | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.marketSummary();
      if (res.isError) throw new Error(JSON.stringify(res.data));
      setSummary(res.data as MarketSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market summary');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <PageLoader />;
  if (error || !summary) return <ErrorState message={error ?? 'No data'} onRetry={load} />;

  return (
    <>
      <Header
        title="Market Overview"
        description="Cross-protocol rankings and market leaders from live on-chain analytics."
        badge="Market Summary"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Protocols Analyzed" value={String(summary.protocolsAnalyzed)} icon={TrendingUp} />
        <KpiCard
          label="Top TVL"
          value={summary.highestTvl.name}
          icon={DollarSign}
          subtitle={formatUsd(summary.highestTvl.value)}
        />
        <KpiCard
          label="Top Volume"
          value={summary.highestVolume.name}
          icon={BarChart3}
          accent="secondary"
          subtitle={formatUsd(summary.highestVolume.value)}
        />
        <KpiCard
          label="Strongest Overall"
          value={summary.overallStrongestProtocol.name}
          icon={Crown}
          accent="accent"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <RankingCard title="TVL Rankings" rows={summary.rankingByTvl} format={formatUsd} />
        <RankingCard title="Volume Rankings" rows={summary.rankingByVolume} format={formatUsd} />
        <RankingCard
          title="Transaction Rankings"
          rows={summary.rankingByTransactions}
          format={(v) => formatCount(v)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RankingBarChart title="TVL Rankings" rows={summary.rankingByTvl} valueFormatter={formatUsd} />
        <RankingBarChart title="Volume Rankings" rows={summary.rankingByVolume} valueFormatter={formatUsd} />
        <RankingBarChart
          title="Transaction Rankings"
          rows={summary.rankingByTransactions}
          valueFormatter={formatCount}
        />
      </div>
    </>
  );
}

function RankingCard({
  title,
  rows,
  format,
}: {
  title: string;
  rows: Array<{ rank: number; name: string; value: string }>;
  format: (v: string) => string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-xl bg-white/4 px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant={row.rank === 1 ? 'success' : 'default'}>#{row.rank}</Badge>
              <span className="font-medium">{row.name}</span>
            </div>
            <span className="text-sm text-muted">{format(row.value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
