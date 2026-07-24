import type { ProtocolComparison } from './compare.js';

export interface PaymentDetails {
  amount: number;
  recipient: string;
  transactionHash: string;
  status: string;
}

function formatUsd(value: string): string {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function leaderName(
  comparison: ProtocolComparison,
  leader: 'protocolA' | 'protocolB' | 'tie',
): string {
  if (leader === 'protocolA') return comparison.protocolA.name;
  if (leader === 'protocolB') return comparison.protocolB.name;
  return 'Tie';
}

export function formatProtocolComparisonReport(
  comparison: ProtocolComparison,
  payment: PaymentDetails,
): string {
  const { protocolA, protocolB, metrics, recommendation } = comparison;

  return `# Protocol Research Report

## Payment

- **Amount:** ${payment.amount} ℏ
- **Recipient:** ${payment.recipient}
- **Transaction:** ${payment.transactionHash}
- **Status:** ${payment.status}

## ${protocolA.name} vs ${protocolB.name}

| Metric | ${protocolA.name} | ${protocolB.name} | Leader |
| --- | --- | --- | --- |
| TVL | ${formatUsd(metrics.totalValueLockedUSD.protocolA)} | ${formatUsd(metrics.totalValueLockedUSD.protocolB)} | ${leaderName(comparison, metrics.totalValueLockedUSD.leader)} |
| Volume | ${formatUsd(metrics.totalVolumeUSD.protocolA)} | ${formatUsd(metrics.totalVolumeUSD.protocolB)} | ${leaderName(comparison, metrics.totalVolumeUSD.leader)} |
| Transactions | ${Number(metrics.txCount.protocolA).toLocaleString('en-US')} | ${Number(metrics.txCount.protocolB).toLocaleString('en-US')} | ${leaderName(comparison, metrics.txCount.leader)} |

## Recommendation

${recommendation}
`;
}
