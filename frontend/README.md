# ChainPilot Frontend

Production-quality demo UI for **ChainPilot** — an AI-native DeFi research platform powered by live MCP tools, The Graph, and Hedera Testnet.

This frontend is a **visual client only**. It does not duplicate business logic. All protocol comparisons, market summaries, wallet operations, and research purchases call the same backend modules used by the ChainPilot MCP server.

## Prerequisites

1. ChainPilot backend configured at the repository root (`.env` with Graph + Hedera credentials)
2. Node.js 20+

## Setup

From the repository root:

```bash
# Ensure backend env is configured
cp .env.example .env
# Edit .env with THE_GRAPH_API_KEY, HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, etc.

# Build backend (required — frontend loads dist/ at runtime)
npm run build

# Install frontend dependencies
cd frontend
npm install
```

## Run alongside MCP server

The MCP server and frontend run independently:

```bash
# Terminal 1 — MCP server (unchanged)
cd ..
npm run dev

# Terminal 2 — Frontend dashboard
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
frontend/src/app/api/mcp/route.ts   →  POST /api/mcp
frontend/src/server/mcp-tools.ts    →  Wraps existing backend modules
../graph/*                          →  The Graph live metrics
../hedera/*                         →  Hedera Testnet wallet
../src/purchase-research.ts         →  Paid research reports
```

The Developer Console exposes the same tool surface as the MCP server:

- `hello`
- `list_protocols`
- `get_protocol`
- `compare_multiple_protocols`
- `market_summary`
- `wallet_balance`
- `transfer_hbar`
- `purchase_research`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with live stats & quick actions |
| `/protocols` | Protocol Explorer — live KPI metrics |
| `/compare` | Two-protocol comparison with charts |
| `/compare-multiple` | Multi-protocol rankings |
| `/market` | Market overview & rankings |
| `/wallet` | HBAR balance & transfers |
| `/research` | Purchase markdown research reports |
| `/developer` | MCP tool console for judges |
| `/settings` | Integration overview |

## Build

```bash
npm run build
npm start
```

## Notes

- All blockchain data is **live** — no mocked responses
- Credentials are loaded from `../.env` automatically
- The MCP server in `src/index.ts` is **not modified** by this frontend
