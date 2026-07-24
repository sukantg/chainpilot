/** Default The Graph gateway endpoint (replace API key when querying live data). */
const THE_GRAPH_ENDPOINT = 'https://gateway.thegraph.com/api/subgraphs/id';

export interface Protocol {
  id: string;
  name: string;
  totalValueLockedUSD: string;
  totalVolumeUSD: string;
  txCount: string;
}

const PROTOCOL_QUERY = `
  query Protocol($id: ID!) {
    protocol(id: $id) {
      id
      name
      totalValueLockedUSD
      totalVolumeUSD
      txCount
    }
  }
`;

const MOCK_PROTOCOLS: Record<string, Protocol> = {
  uniswap: {
    id: 'uniswap',
    name: 'Uniswap',
    totalValueLockedUSD: '4200000000',
    totalVolumeUSD: '89000000000',
    txCount: '125000000',
  },
  aave: {
    id: 'aave',
    name: 'Aave',
    totalValueLockedUSD: '8100000000',
    totalVolumeUSD: '45000000000',
    txCount: '42000000',
  },
  curve: {
    id: 'curve',
    name: 'Curve',
    totalValueLockedUSD: '2300000000',
    totalVolumeUSD: '31000000000',
    txCount: '18000000',
  },
};

export class GraphClient {
  constructor(private readonly endpoint: string = THE_GRAPH_ENDPOINT) {}

  async query<T>(
    _query: string,
    _variables?: Record<string, unknown>,
  ): Promise<T> {
    // Real GraphQL requests will go here once subgraph IDs are configured.
    throw new Error('GraphQL queries are not implemented yet');
  }
}

export const graphClient = new GraphClient();

export async function getProtocol(protocolName: string): Promise<Protocol> {
  const key = protocolName.toLowerCase().trim();
  const known = MOCK_PROTOCOLS[key];

  if (known) {
    return known;
  }

  return {
    id: key,
    name: protocolName,
    totalValueLockedUSD: '1000000',
    totalVolumeUSD: '5000000',
    txCount: '10000',
  };
}

export { PROTOCOL_QUERY };
