'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCount, formatUsd, parseMetricValue, shouldUseLogScale } from '@/lib/utils';

interface ChartItem {
  name: string;
  tvl: number;
  volume: number;
  transactions: number;
}

export const PROTOCOL_COLORS: Record<string, string> = {
  Uniswap: '#FF007A',
  Aave: '#A855F7',
  Curve: '#0EA5E9',
};

const DEFAULT_BAR_COLOR = '#3b82f6';

export function getProtocolColor(name: string): string {
  return PROTOCOL_COLORS[name] ?? DEFAULT_BAR_COLOR;
}

export function ProtocolComparisonChart({ data }: { data: ChartItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <MetricBarChart title="TVL Comparison" data={data} dataKey="tvl" valueFormatter={formatUsd} />
      <MetricBarChart
        title="Volume Comparison"
        data={data}
        dataKey="volume"
        valueFormatter={formatUsd}
      />
      <MetricBarChart
        title="Transaction Comparison"
        data={data}
        dataKey="transactions"
        valueFormatter={formatCount}
      />
    </div>
  );
}

export function RankingBarChart({
  title,
  rows,
  valueFormatter = formatUsd,
}: {
  title: string;
  rows: Array<{ rank: number; name: string; value: string }>;
  valueFormatter?: (value: string | number) => string;
}) {
  const data = [...rows]
    .sort((a, b) => parseMetricValue(b.value) - parseMetricValue(a.value))
    .map((row) => ({
      name: row.name,
      rank: row.rank,
      value: parseMetricValue(row.value),
      label: valueFormatter(row.value),
      fill: getProtocolColor(row.name),
    }));

  const values = data.map((row) => row.value);
  const useLogScale = shouldUseLogScale(values);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {useLogScale && (
          <p className="text-xs text-muted">Log scale used so all protocols remain visible.</p>
        )}
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 96, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              scale={useLogScale ? 'log' : 'linear'}
              domain={useLogScale ? ['auto', 'auto'] : [0, 'auto']}
              stroke="#71717a"
              fontSize={12}
              tickFormatter={(value) => formatAxis(Number(value))}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#71717a"
              fontSize={12}
              width={72}
              tick={{ fill: '#e4e4e7' }}
            />
            <Tooltip content={<MetricTooltip valueFormatter={valueFormatter} />} cursor={false} />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              minPointSize={6}
              isAnimationActive={false}
              activeBar={{ fill: undefined, stroke: 'none' }}
            >
              {data.map((entry, index) => (
                <Cell key={`rank-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="label" position="right" fill="#d4d4d8" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MetricBarChart({
  title,
  data,
  dataKey,
  valueFormatter,
}: {
  title: string;
  data: ChartItem[];
  dataKey: keyof ChartItem;
  valueFormatter: (value: string | number) => string;
}) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: item[dataKey] as number,
    label: valueFormatter(item[dataKey] as number),
    fill: getProtocolColor(item.name),
  }));

  const values = chartData.map((item) => item.value);
  const useLogScale = shouldUseLogScale(values);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {useLogScale && (
          <p className="text-xs text-muted">Log scale used so all protocols remain visible.</p>
        )}
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tick={{ fill: '#e4e4e7' }} />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              scale={useLogScale ? 'log' : 'linear'}
              domain={useLogScale ? ['auto', 'auto'] : [0, 'auto']}
              tickFormatter={(value) => formatAxis(Number(value))}
            />
            <Tooltip content={<MetricTooltip valueFormatter={valueFormatter} />} cursor={false} />
            <Legend />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              minPointSize={6}
              isAnimationActive={false}
              activeBar={{ fill: undefined, stroke: 'none' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`metric-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="label" position="top" fill="#d4d4d8" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MetricTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { name?: string; label?: string; value?: number } }>;
  valueFormatter: (value: string | number) => string;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item?.name) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f111a] px-3 py-2 text-sm shadow-lg">
      <p className="font-medium" style={{ color: getProtocolColor(item.name) }}>
        {item.name}
      </p>
      <p className="text-muted">{item.label ?? valueFormatter(item.value ?? 0)}</p>
    </div>
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
    tvl: parseMetricValue(p.totalValueLockedUSD ?? p.tvl),
    volume: parseMetricValue(p.totalVolumeUSD ?? p.volume),
    transactions: parseMetricValue(p.txCount ?? p.transactionCount),
  }));
}

export { type ChartItem };
