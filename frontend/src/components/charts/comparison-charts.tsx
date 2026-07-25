'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartItem {
  name: string;
  tvl: number;
  volume: number;
  transactions: number;
}

export function ProtocolComparisonChart({ data }: { data: ChartItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <MetricBarChart title="TVL Comparison" data={data} dataKey="tvl" color="#3b82f6" />
      <MetricBarChart title="Volume Comparison" data={data} dataKey="volume" color="#8b5cf6" />
      <MetricBarChart
        title="Transaction Comparison"
        data={data}
        dataKey="transactions"
        color="#06b6d4"
      />
    </div>
  );
}

function MetricBarChart({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: ChartItem[];
  dataKey: keyof ChartItem;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => formatAxis(v)} />
            <Tooltip
              contentStyle={{
                background: '#0f111a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatAxis(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export function toChartData(
  protocols: Array<{
    name: string;
    totalValueLockedUSD?: string;
    tvl?: string;
    totalVolumeUSD?: string;
    volume?: string;
    txCount?: string;
    transactionCount?: string;
  }>,
): ChartItem[] {
  return protocols.map((p) => ({
    name: p.name,
    tvl: Number(p.totalValueLockedUSD ?? p.tvl ?? 0),
    volume: Number(p.totalVolumeUSD ?? p.volume ?? 0),
    transactions: Number(p.txCount ?? p.transactionCount ?? 0),
  }));
}
