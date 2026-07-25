'use client';

import { getProtocolColor } from '@/components/charts/comparison-charts';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/shared/kpi-card';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn, formatCount, formatUsd } from '@/lib/utils';
import { Activity, BarChart3, DollarSign, Layers, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const PROTOCOL_ACCENTS: Record<string, string> = {
  uniswap: 'border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-rose-500/5',
  aave: 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5',
  curve: 'border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-blue-500/5',
};

function ProtocolExplorerContent() {
  const searchParams = useSearchParams();
  const [protocols, setProtocols] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState(searchParams.get('protocol') ?? 'uniswap');
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    name: string;
    tvl: string;
    volume: string;
    transactionCount: string;
  } | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const loadMetrics = useCallback(async (protocol: string) => {
    setMetricsLoading(true);
    setError(null);
    try {
      const res = await api.getProtocol(protocol);
      if (res.isError) throw new Error(String(res.data));
      setMetrics(res.data);
      setRefreshedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load protocol');
    } finally {
      setMetricsLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void api.listProtocols().then((res) => {
      setProtocols(res.data.protocols);
    });
  }, []);

  useEffect(() => {
    void loadMetrics(selected);
  }, [selected, loadMetrics]);

  if (loading && !metrics) return <PageLoader />;
  if (error && !metrics) return <ErrorState message={error} onRetry={() => loadMetrics(selected)} />;

  const accentClass = PROTOCOL_ACCENTS[selected] ?? 'border-white/10 bg-white/5';
  const brandColor = metrics ? getProtocolColor(metrics.name) : undefined;

  return (
    <>
      <Header
        title="Protocol Explorer"
        description="Live protocol metrics from The Graph — TVL, volume, and transaction count."
        badge="On-chain Analytics"
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="protocol-select">Protocol</Label>
          <Select
            id="protocol-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Select protocol"
          >
            {protocols.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="outline" onClick={() => loadMetrics(selected)} disabled={metricsLoading}>
          <RefreshCw className={`h-4 w-4 ${metricsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!metrics ? (
        <EmptyState
          icon={Layers}
          title="No protocol selected"
          description="Choose a protocol to view live on-chain metrics."
        />
      ) : (
        <>
          <div
            className={cn('mb-6 rounded-2xl border p-5', accentClass)}
            style={brandColor ? { borderColor: `${brandColor}55` } : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <div>
                <p className="text-sm text-muted">Selected protocol</p>
                <p className="text-2xl font-semibold">{metrics.name}</p>
              </div>
              <Badge variant="success" className="ml-auto">
                Live
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="TVL" value={formatUsd(metrics.tvl)} icon={DollarSign} />
            <KpiCard label="Volume" value={formatUsd(metrics.volume)} icon={BarChart3} accent="secondary" />
            <KpiCard
              label="Transactions"
              value={formatCount(metrics.transactionCount)}
              icon={Activity}
              accent="accent"
            />
          </div>
          {refreshedAt && (
            <p className="mt-4 text-xs text-muted">
              Last refreshed: {new Date(refreshedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </>
  );
}

export default function ProtocolsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProtocolExplorerContent />
    </Suspense>
  );
}
