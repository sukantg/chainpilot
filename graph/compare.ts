import {
  getProtocol,
  type Protocol,
} from './client.js';
import { getSupportedProtocols, isSupportedProtocol } from './config.js';

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

export interface ProtocolRankEntry {
  rank: number;
  id: string;
  name: string;
  value: string;
}

export interface ProtocolHighlight {
  id: string;
  name: string;
  value: string;
}

export interface MarketSummary {
  protocolsAnalyzed: number;
  highestTvl: ProtocolHighlight;
  highestVolume: ProtocolHighlight;
  highestTransactionCount: ProtocolHighlight;
  rankingByTvl: ProtocolRankEntry[];
  rankingByVolume: ProtocolRankEntry[];
  rankingByTransactions: ProtocolRankEntry[];
  overallStrongestProtocol: Pick<Protocol, 'id' | 'name'>;
}

export interface MultipleProtocolComparison {
  protocols: Array<
    Pick<Protocol, 'name' | 'totalValueLockedUSD' | 'totalVolumeUSD' | 'txCount'>
  >;
  leaders: {
    tvl: string;
    volume: string;
    transactions: string;
  };
  recommendation: string;
}

const METRIC_LABELS = {
  totalValueLockedUSD: 'TVL',
  totalVolumeUSD: 'volume',
  txCount: 'transaction count',
} as const;

type MetricKey = keyof typeof METRIC_LABELS;

function compareMetric(
  valueA: string,
  valueB: string,
): Pick<MetricComparison, 'leader'> {
  const a = Number(valueA);
  const b = Number(valueB);

  if (a === b) return { leader: 'tie' };
  return { leader: a > b ? 'protocolA' : 'protocolB' };
}

function rankByMetric(protocols: Protocol[], metric: MetricKey): ProtocolRankEntry[] {
  return [...protocols]
    .sort((a, b) => Number(b[metric]) - Number(a[metric]))
    .map((protocol, index) => ({
      rank: index + 1,
      id: protocol.id,
      name: protocol.name,
      value: protocol[metric],
    }));
}

function getMetricHighlight(protocols: Protocol[], metric: MetricKey): ProtocolHighlight {
  const [leader] = rankByMetric(protocols, metric);

  return {
    id: leader.id,
    name: leader.name,
    value: leader.value,
  };
}

function countMetricWins(
  protocolA: Protocol,
  protocolB: Protocol,
): { winsA: string[]; winsB: string[] } {
  const winsA: string[] = [];
  const winsB: string[] = [];

  for (const [key, label] of Object.entries(METRIC_LABELS)) {
    const { leader } = compareMetric(
      protocolA[key as MetricKey],
      protocolB[key as MetricKey],
    );

    if (leader === 'protocolA') winsA.push(label);
    if (leader === 'protocolB') winsB.push(label);
  }

  return { winsA, winsB };
}

function determineOverallStrongest(
  protocols: Protocol[],
): Pick<Protocol, 'id' | 'name'> {
  const wins = new Map<string, number>();

  for (const protocol of protocols) {
    wins.set(protocol.id, 0);
  }

  for (const metric of Object.keys(METRIC_LABELS) as MetricKey[]) {
    const ranking = rankByMetric(protocols, metric);
    const topValue = ranking[0]?.value;

    for (const entry of ranking) {
      if (entry.value !== topValue) break;
      wins.set(entry.id, (wins.get(entry.id) ?? 0) + 1);
    }
  }

  const maxWins = Math.max(...wins.values());
  const leaders = protocols.filter((protocol) => wins.get(protocol.id) === maxWins);
  const [strongest] = rankByMetric(leaders, 'totalValueLockedUSD');

  return {
    id: strongest.id,
    name: strongest.name,
  };
}

function protocolLabel(protocol: Protocol): string {
  return protocol.name;
}

function buildRecommendation(
  protocolA: Protocol,
  protocolB: Protocol,
): string {
  const nameA = protocolLabel(protocolA);
  const nameB = protocolLabel(protocolB);
  const { winsA, winsB } = countMetricWins(protocolA, protocolB);

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

function validateComparisonProtocols(protocolNames: string[]): string[] {
  if (protocolNames.length < 2) {
    throw new Error('At least 2 protocols are required for comparison.');
  }

  const unsupported = protocolNames.filter((name) => !isSupportedProtocol(name));
  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported protocol(s): ${unsupported.join(', ')}. Supported protocols: ${getSupportedProtocols().join(', ')}`,
    );
  }

  const normalized = [
    ...new Set(protocolNames.map((name) => name.toLowerCase().trim())),
  ];

  if (normalized.length < 2) {
    throw new Error('At least 2 unique protocols are required for comparison.');
  }

  return normalized;
}

function buildMultiProtocolRecommendation(protocols: Protocol[]): string {
  const strongest = determineOverallStrongest(protocols);
  const winsByProtocol = new Map<string, string[]>();

  for (const protocol of protocols) {
    winsByProtocol.set(protocol.name, []);
  }

  for (const [metric, label] of Object.entries(METRIC_LABELS)) {
    const leader = getMetricHighlight(protocols, metric as MetricKey);
    winsByProtocol.get(leader.name)?.push(label);
  }

  const wins = winsByProtocol.get(strongest.name) ?? [];
  const metricCount = Object.keys(METRIC_LABELS).length;

  if (wins.length === metricCount) {
    return `${strongest.name} is the strongest overall choice: it leads on ${wins.join(', ')}. Prefer ${strongest.name} for broader on-chain activity and liquidity depth.`;
  }

  if (wins.length > 1) {
    return `${strongest.name} is the strongest overall choice: it leads on ${wins.join(', ')}. Prefer ${strongest.name} for broader on-chain activity and liquidity depth.`;
  }

  if (wins.length === 1) {
    return `${strongest.name} is the strongest overall choice: it leads on ${wins[0]}. Metrics are mixed across protocols; prefer ${strongest.name} where ${wins[0]} matters most.`;
  }

  return `${strongest.name} is the strongest overall choice based on TVL tiebreak. Protocols are evenly matched across TVL, volume, and transaction count.`;
}

export async function compareMultipleProtocols(
  protocolNames: string[],
): Promise<MultipleProtocolComparison> {
  const normalized = validateComparisonProtocols(protocolNames);
  const protocols = await Promise.all(normalized.map((id) => getProtocol(id)));

  return {
    protocols: protocols.map(
      ({ name, totalValueLockedUSD, totalVolumeUSD, txCount }) => ({
        name,
        totalValueLockedUSD,
        totalVolumeUSD,
        txCount,
      }),
    ),
    leaders: {
      tvl: getMetricHighlight(protocols, 'totalValueLockedUSD').name,
      volume: getMetricHighlight(protocols, 'totalVolumeUSD').name,
      transactions: getMetricHighlight(protocols, 'txCount').name,
    },
    recommendation: buildMultiProtocolRecommendation(protocols),
  };
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const protocolIds = getSupportedProtocols();
  const protocols = await Promise.all(protocolIds.map((id) => getProtocol(id)));

  return {
    protocolsAnalyzed: protocols.length,
    highestTvl: getMetricHighlight(protocols, 'totalValueLockedUSD'),
    highestVolume: getMetricHighlight(protocols, 'totalVolumeUSD'),
    highestTransactionCount: getMetricHighlight(protocols, 'txCount'),
    rankingByTvl: rankByMetric(protocols, 'totalValueLockedUSD'),
    rankingByVolume: rankByMetric(protocols, 'totalVolumeUSD'),
    rankingByTransactions: rankByMetric(protocols, 'txCount'),
    overallStrongestProtocol: determineOverallStrongest(protocols),
  };
}

export async function compareProtocols(
  protocolA: string,
  protocolB: string,
): Promise<ProtocolComparison> {
  if (!isSupportedProtocol(protocolA) || !isSupportedProtocol(protocolB)) {
    throw new Error(
      `Both protocols must be supported for live comparison. Supported protocols: ${getSupportedProtocols().join(', ')}`,
    );
  }

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
    recommendation: buildRecommendation(a, b),
  };
}
