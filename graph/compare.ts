import { getProtocol, type Protocol } from './client.js';

export interface MetricComparison {
  protocolA: string;
  protocolB: string;
  leader: 'protocolA' | 'protocolB' | 'tie';
}

export interface ProtocolComparison {
  protocolA: Protocol;
  protocolB: Protocol;
  metrics: {
    totalValueLockedUSD: MetricComparison;
    totalVolumeUSD: MetricComparison;
    txCount: MetricComparison;
  };
  recommendation: string;
}

function compareMetric(
  valueA: string,
  valueB: string,
): Pick<MetricComparison, 'leader'> {
  const a = Number(valueA);
  const b = Number(valueB);

  if (a === b) return { leader: 'tie' };
  return { leader: a > b ? 'protocolA' : 'protocolB' };
}

function protocolLabel(protocol: Protocol): string {
  return protocol.name;
}

function buildRecommendation(
  protocolA: Protocol,
  protocolB: Protocol,
  metrics: ProtocolComparison['metrics'],
): string {
  const nameA = protocolLabel(protocolA);
  const nameB = protocolLabel(protocolB);

  const metricLabels = {
    totalValueLockedUSD: 'TVL',
    totalVolumeUSD: 'volume',
    txCount: 'transaction count',
  } as const;

  const winsA: string[] = [];
  const winsB: string[] = [];

  for (const [key, label] of Object.entries(metricLabels)) {
    const leader = metrics[key as keyof typeof metricLabels].leader;
    if (leader === 'protocolA') winsA.push(label);
    if (leader === 'protocolB') winsB.push(label);
  }

  if (winsA.length > winsB.length) {
    return `${nameA} is the stronger overall choice: it leads on ${winsA.join(', ')}. Prefer ${nameA} for broader on-chain activity and liquidity depth.`;
  }

  if (winsB.length > winsA.length) {
    return `${nameB} is the stronger overall choice: it leads on ${winsB.join(', ')}. Prefer ${nameB} for broader on-chain activity and liquidity depth.`;
  }

  if (winsA.length === 0) {
    return `${nameA} and ${nameB} are evenly matched across TVL, volume, and transaction count. Either protocol is a reasonable choice depending on your use case.`;
  }

  return `Metrics are mixed: ${nameA} leads on ${winsA.join(', ')} while ${nameB} leads on ${winsB.join(', ')}. Prefer ${nameA} where ${winsA[0]} matters most and ${nameB} where ${winsB[0]} matters most.`;
}

export async function compareProtocols(
  protocolA: string,
  protocolB: string,
): Promise<ProtocolComparison> {
  const [a, b] = await Promise.all([
    getProtocol(protocolA),
    getProtocol(protocolB),
  ]);

  const metrics = {
    totalValueLockedUSD: {
      protocolA: a.totalValueLockedUSD,
      protocolB: b.totalValueLockedUSD,
      ...compareMetric(a.totalValueLockedUSD, b.totalValueLockedUSD),
    },
    totalVolumeUSD: {
      protocolA: a.totalVolumeUSD,
      protocolB: b.totalVolumeUSD,
      ...compareMetric(a.totalVolumeUSD, b.totalVolumeUSD),
    },
    txCount: {
      protocolA: a.txCount,
      protocolB: b.txCount,
      ...compareMetric(a.txCount, b.txCount),
    },
  };

  return {
    protocolA: a,
    protocolB: b,
    metrics,
    recommendation: buildRecommendation(a, b, metrics),
  };
}
