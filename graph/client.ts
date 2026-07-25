import { GraphQLClient } from 'graphql-request';
import {
  buildSubgraphEndpoint,
  getSupportedProtocols,
  PROTOCOL_GRAPH_CONFIG,
  PROTOCOL_QUERY,
  UNISWAP_V3_QUERY,
} from './config.js';
import { getGraphApiKey } from './env.js';

export interface Protocol {
  id: string;
  name: string;
  totalValueLockedUSD: string;
  totalVolumeUSD: string;
  txCount: string;
}

export class GraphClient {
  private readonly client: GraphQLClient;

  constructor(endpoint: string) {
    this.client = new GraphQLClient(endpoint);
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.client.request<T>(query, variables);
  }
}

let defaultGraphClient: GraphClient | null = null;

function getDefaultGraphClient(): GraphClient {
  if (!defaultGraphClient) {
    const apiKey = getGraphApiKey();
    const endpoint = buildSubgraphEndpoint(apiKey, 'uniswap');
    defaultGraphClient = new GraphClient(endpoint);
  }

  return defaultGraphClient;
}

export const graphClient = {
  query<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return getDefaultGraphClient().query<T>(query, variables);
  },
};

export function createGraphClient(protocolKey: string): GraphClient {
  const apiKey = getGraphApiKey();
  const endpoint = buildSubgraphEndpoint(apiKey, protocolKey);
  return new GraphClient(endpoint);
}

export async function getProtocol(protocolName: string): Promise<Protocol> {
  const key = protocolName.toLowerCase().trim();
  const config = PROTOCOL_GRAPH_CONFIG[key];

  if (!config) {
    throw new Error(
      `Unsupported protocol "${protocolName}". Supported protocols: ${getSupportedProtocols().join(', ')}`,
    );
  }

  const client = createGraphClient(key);
  const data = await client.query(config.query, config.variables);
  const metrics = config.transform(data);

  return {
    id: key,
    name: config.displayName,
    ...metrics,
  };
}

export { PROTOCOL_QUERY, UNISWAP_V3_QUERY };
