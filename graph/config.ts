export interface ProtocolMetrics {
  totalValueLockedUSD: string;
  totalVolumeUSD: string;
  txCount: string;
}

export const GRAPH_GATEWAY_BASE_URL = 'https://gateway.thegraph.com/api';

export interface SubgraphEndpointConfig {
  subgraphId: string;
}

export const SUBGRAPH_ENDPOINTS: Record<string, SubgraphEndpointConfig> = {
  uniswap: {
    subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
  },
  aave: {
    subgraphId: 'Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g',
  },
  curve: {
    subgraphId: '3fy93eAT56UJsRCEht8iFhfi6wjHWXtZ9dnnbQmvFopF',
  },
};

export interface ProtocolGraphConfig {
  displayName: string;
  query: string;
  variables?: Record<string, unknown>;
  transform: (data: unknown) => ProtocolMetrics;
}

const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const AAVE_V3_PROTOCOL_ID = '1';
const CURVE_PROTOCOL_ID = '0x0000000022d53366457f9d5e68ec105046fc4383';

export const UNISWAP_V3_QUERY = `
  query UniswapV3FactoryMetrics($id: ID!) {
    factory(id: $id) {
      totalValueLockedUSD
      totalVolumeUSD
      txCount
    }
  }
`;

export const AAVE_V3_QUERY = `
  query AaveV3ProtocolMetrics($id: ID!) {
    protocol(id: $id) {
      id
      pools(where: { active: true }) {
        id
        reserves(where: { isActive: true, isFrozen: false, isPaused: false }) {
          decimals
          totalLiquidity
          lifetimeLiquidity
          lifetimeBorrows
          lifetimeRepayments
          lifetimeFlashLoans
          price {
            priceInEth
          }
        }
        borrowHistory(first: 1000) {
          id
        }
        supplyHistory(first: 1000) {
          id
        }
        repayHistory(first: 1000) {
          id
        }
        flashLoanHistory(first: 1000) {
          id
        }
      }
    }
  }
`;

export const CURVE_QUERY = `
  query CurveProtocolMetrics($id: ID!) {
    dexAmmProtocol(id: $id) {
      totalValueLockedUSD
      cumulativeVolumeUSD
      cumulativeUniqueUsers
    }
    usageMetricsDailySnapshots(first: 2500, orderBy: timestamp, orderDirection: asc) {
      dailyTransactionCount
    }
  }
`;

interface UniswapV3Response {
  factory: {
    totalValueLockedUSD: string;
    totalVolumeUSD: string;
    txCount: string;
  } | null;
}

interface AaveV3Reserve {
  decimals: number;
  totalLiquidity: string;
  lifetimeLiquidity: string;
  lifetimeBorrows: string;
  lifetimeRepayments: string;
  lifetimeFlashLoans: string;
  price: {
    priceInEth: string;
  };
}

interface AaveV3Pool {
  id: string;
  reserves: AaveV3Reserve[];
  borrowHistory: Array<{ id: string }>;
  supplyHistory: Array<{ id: string }>;
  repayHistory: Array<{ id: string }>;
  flashLoanHistory: Array<{ id: string }>;
}

interface AaveV3Response {
  protocol: {
    id: string;
    pools: AaveV3Pool[];
  } | null;
}

function reserveUsdPrice(priceInEth: string): number {
  return Number(priceInEth) / 1e8;
}

function transformAave(data: unknown): ProtocolMetrics {
  const response = data as AaveV3Response;

  if (!response.protocol?.pools.length) {
    throw new Error('Aave V3 protocol data was not found in The Graph response');
  }

  let totalValueLockedUSD = 0;
  let totalVolumeUSD = 0;
  let txCount = 0;

  for (const pool of response.protocol.pools) {
    txCount +=
      pool.borrowHistory.length +
      pool.supplyHistory.length +
      pool.repayHistory.length +
      pool.flashLoanHistory.length;

    for (const reserve of pool.reserves) {
      const scale = 10 ** reserve.decimals;
      const usdPrice = reserveUsdPrice(reserve.price.priceInEth);

      if (usdPrice === 0) {
        continue;
      }

      const liquidity = Number(reserve.totalLiquidity) / scale;
      totalValueLockedUSD += liquidity * usdPrice;

      const lifetimeLiquidity = Number(reserve.lifetimeLiquidity) / scale;
      const lifetimeBorrows = Number(reserve.lifetimeBorrows) / scale;
      const lifetimeRepayments = Number(reserve.lifetimeRepayments) / scale;
      const lifetimeFlashLoans = Number(reserve.lifetimeFlashLoans) / scale;

      totalVolumeUSD +=
        (lifetimeLiquidity +
          lifetimeBorrows +
          lifetimeRepayments +
          lifetimeFlashLoans) *
        usdPrice;
    }
  }

  if (totalValueLockedUSD === 0) {
    throw new Error('Aave V3 reserve metrics were not found in The Graph response');
  }

  return {
    totalValueLockedUSD: totalValueLockedUSD.toString(),
    totalVolumeUSD: totalVolumeUSD.toString(),
    txCount: txCount.toString(),
  };
}

interface CurveResponse {
  dexAmmProtocol: {
    totalValueLockedUSD: string;
    cumulativeVolumeUSD: string;
    cumulativeUniqueUsers: number;
  } | null;
  usageMetricsDailySnapshots: Array<{
    dailyTransactionCount: number;
  }>;
}

function transformUniswap(data: unknown): ProtocolMetrics {
  const response = data as UniswapV3Response;

  if (!response.factory) {
    throw new Error('Uniswap V3 factory data was not found in The Graph response');
  }

  return {
    totalValueLockedUSD: response.factory.totalValueLockedUSD,
    totalVolumeUSD: response.factory.totalVolumeUSD,
    txCount: response.factory.txCount,
  };
}

function transformCurve(data: unknown): ProtocolMetrics {
  const response = data as CurveResponse;

  if (!response.dexAmmProtocol) {
    throw new Error('Curve Finance protocol data was not found in The Graph response');
  }

  const { totalValueLockedUSD, cumulativeVolumeUSD } = response.dexAmmProtocol;

  if (!totalValueLockedUSD || Number(totalValueLockedUSD) === 0) {
    throw new Error('Curve Finance TVL was not found in The Graph response');
  }

  if (!cumulativeVolumeUSD || Number(cumulativeVolumeUSD) === 0) {
    throw new Error('Curve Finance volume was not found in The Graph response');
  }

  if (!response.usageMetricsDailySnapshots.length) {
    throw new Error('Curve Finance usage metrics were not found in The Graph response');
  }

  const txCount = response.usageMetricsDailySnapshots.reduce(
    (sum, snapshot) => sum + snapshot.dailyTransactionCount,
    0,
  );

  if (txCount === 0) {
    throw new Error('Curve Finance transaction count was not found in The Graph response');
  }

  return {
    totalValueLockedUSD,
    totalVolumeUSD: cumulativeVolumeUSD,
    txCount: txCount.toString(),
  };
}

export const PROTOCOL_GRAPH_CONFIG: Record<string, ProtocolGraphConfig> = {
  uniswap: {
    displayName: 'Uniswap',
    query: UNISWAP_V3_QUERY,
    variables: { id: UNISWAP_V3_FACTORY },
    transform: transformUniswap,
  },
  aave: {
    displayName: 'Aave',
    query: AAVE_V3_QUERY,
    variables: { id: AAVE_V3_PROTOCOL_ID },
    transform: transformAave,
  },
  curve: {
    displayName: 'Curve',
    query: CURVE_QUERY,
    variables: { id: CURVE_PROTOCOL_ID },
    transform: transformCurve,
  },
};

export function buildSubgraphEndpoint(
  apiKey: string,
  protocolKey: string,
): string {
  const endpointConfig = SUBGRAPH_ENDPOINTS[protocolKey];

  if (!endpointConfig) {
    throw new Error(`No subgraph endpoint configured for protocol "${protocolKey}"`);
  }

  return `${GRAPH_GATEWAY_BASE_URL}/${apiKey}/subgraphs/id/${endpointConfig.subgraphId}`;
}

export function isSupportedProtocol(protocolName: string): boolean {
  return protocolName.toLowerCase().trim() in PROTOCOL_GRAPH_CONFIG;
}

export function getSupportedProtocols(): string[] {
  return Object.keys(PROTOCOL_GRAPH_CONFIG);
}

export interface ProtocolSummary {
  id: string;
  name: string;
  supported: boolean;
}

export function listProtocols(): ProtocolSummary[] {
  return getSupportedProtocols().map((id) => ({
    id,
    name: PROTOCOL_GRAPH_CONFIG[id].displayName,
    supported: isSupportedProtocol(id),
  }));
}

/** @deprecated Use UNISWAP_V3_QUERY instead. Kept for backward compatibility. */
export const PROTOCOL_QUERY = UNISWAP_V3_QUERY;
