import type { ProtocolComparison } from './compare.js';

export interface PaymentDetails {
  amount: number;
  recipient: string;
  transactionHash: string;
  status: string;
}

type MetricKey = 'totalValueLockedUSD' | 'totalVolumeUSD' | 'txCount';

const METRIC_ROWS: Array<{ key: MetricKey; label: string }> = [
  { key: 'totalValueLockedUSD', label: 'TVL' },
  { key: 'totalVolumeUSD', label: 'Volume' },
  { key: 'txCount', label: 'Transaction Count' },
];

function formatUsd(value: string): string {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function formatCount(value: string): string {
  return Number(value).toLocaleString('en-US');
}

function formatMetricValue(key: MetricKey, value: string): string {
  return key === 'txCount' ? formatCount(value) : formatUsd(value);
}

function formatTransactionTimestamp(transactionId: string): string {
  const atIndex = transactionId.lastIndexOf('@');
  if (atIndex === -1) {
    return transactionId;
  }

  const [secondsPart, nanosPart] = transactionId.slice(atIndex + 1).split('.');
  const seconds = Number(secondsPart);
  const nanos = Number(nanosPart ?? 0);

  if (Number.isNaN(seconds)) {
    return transactionId;
  }

  return new Date(seconds * 1000 + nanos / 1_000_000).toISOString();
}

function buildExecutiveSummary(comparison: ProtocolComparison): string {
  const { protocolA, protocolB } = comparison;

  return [
    `This report compares **${protocolA.name}** and **${protocolB.name}** using live on-chain metrics sourced from The Graph.`,
    '',
    `**${protocolA.name}** reports ${formatUsd(protocolA.totalValueLockedUSD)} in TVL, ${formatUsd(protocolA.totalVolumeUSD)} in cumulative volume, and ${formatCount(protocolA.txCount)} transactions.`,
    '',
    `**${protocolB.name}** reports ${formatUsd(protocolB.totalValueLockedUSD)} in TVL, ${formatUsd(protocolB.totalVolumeUSD)} in cumulative volume, and ${formatCount(protocolB.txCount)} transactions.`,
  ].join('\n');
}

function buildMetricsTable(comparison: ProtocolComparison): string {
  const { protocolA, protocolB, metrics } = comparison;
  const rows = METRIC_ROWS.map(({ key, label }) => {
    const valueA = formatMetricValue(key, metrics[key].protocolA);
    const valueB = formatMetricValue(key, metrics[key].protocolB);

    return `| ${label} | ${valueA} | ${valueB} |`;
  });

  return [
    `| Metric | ${protocolA.name} | ${protocolB.name} |`,
    '| --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function buildProtocolStrengths(
  comparison: ProtocolComparison,
  protocol: 'protocolA' | 'protocolB',
): string[] {
  const { protocolA, protocolB, metrics } = comparison;
  const subject = protocol === 'protocolA' ? protocolA : protocolB;
  const peer = protocol === 'protocolA' ? protocolB : protocolA;
  const strengths: string[] = [];

  for (const { key, label } of METRIC_ROWS) {
    const leader = metrics[key].leader;

    if (leader === protocol) {
      strengths.push(
        `- Leads on ${label} with ${formatMetricValue(key, metrics[key][protocol])}.`,
      );
      continue;
    }

    if (leader === 'tie') {
      strengths.push(
        `- Matches ${peer.name} on ${label} at ${formatMetricValue(key, metrics[key][protocol])}.`,
      );
    }
  }

  if (strengths.length === 0) {
    strengths.push(`- Does not lead on any measured metric.`);
  }

  return [`### ${subject.name}`, ...strengths];
}

function buildProtocolWeaknesses(
  comparison: ProtocolComparison,
  protocol: 'protocolA' | 'protocolB',
): string[] {
  const { protocolA, protocolB, metrics } = comparison;
  const subject = protocol === 'protocolA' ? protocolA : protocolB;
  const peer = protocol === 'protocolA' ? protocolB : protocolA;
  const peerKey = protocol === 'protocolA' ? 'protocolB' : 'protocolA';
  const weaknesses: string[] = [];

  for (const { key, label } of METRIC_ROWS) {
    const leader = metrics[key].leader;

    if (leader === peerKey) {
      weaknesses.push(
        `- Trails on ${label} with ${formatMetricValue(key, metrics[key][protocol])} vs ${peer.name}'s ${formatMetricValue(key, metrics[key][peerKey])}.`,
      );
    }
  }

  if (weaknesses.length === 0) {
    weaknesses.push(`- No metric weaknesses relative to ${peer.name}.`);
  }

  return [`### ${subject.name}`, ...weaknesses];
}

export function formatProtocolComparisonReport(
  comparison: ProtocolComparison,
  payment: PaymentDetails,
): string {
  const strengths = [
    ...buildProtocolStrengths(comparison, 'protocolA'),
    '',
    ...buildProtocolStrengths(comparison, 'protocolB'),
  ].join('\n');

  const weaknesses = [
    ...buildProtocolWeaknesses(comparison, 'protocolA'),
    '',
    ...buildProtocolWeaknesses(comparison, 'protocolB'),
  ].join('\n');

  return [
    '# Executive Summary',
    '',
    buildExecutiveSummary(comparison),
    '',
    '# Metrics Comparison',
    '',
    buildMetricsTable(comparison),
    '',
    '# Strengths',
    '',
    strengths,
    '',
    '# Weaknesses',
    '',
    weaknesses,
    '',
    '# Recommendation',
    '',
    comparison.recommendation,
    '',
    '# Payment Details',
    '',
    `- **HBAR paid:** ${payment.amount} ℏ`,
    `- **Transaction ID:** ${payment.transactionHash}`,
    `- **Timestamp:** ${formatTransactionTimestamp(payment.transactionHash)}`,
  ].join('\n');
}
