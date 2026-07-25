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
Dashboard pages  →  Server Actions (runDashboardMcpTool)  →  executeMcpTool
External agents  →  POST /api/mcp  →  x402 gate (when enabled)  →  executeMcpTool
```

```
frontend/src/app/actions/mcp-actions.ts  →  Dashboard MCP (no x402)
frontend/src/app/api/mcp/route.ts        →  Public API + x402
frontend/src/server/mcp-tools.ts         →  Shared tool execution
../graph/*                               →  The Graph live metrics
../hedera/*                              →  Hedera Testnet wallet + HCS
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
- Credentials are loaded from `../.env` locally, or from Vercel Environment Variables in production
- The MCP server in `src/index.ts` is **not modified** by this frontend
- **Dashboard bypasses x402** via server actions so UI pages keep working when x402 is enabled
- **External agents** must pay via x402 on `POST /api/mcp` when `FACILITATOR_URL` + `X402_PAY_TO` are set

## Deploy to Vercel

### 1. Push to GitHub

Ensure the full repo is pushed (both root backend and `frontend/`).

### 2. Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Framework Preset: **Next.js** (auto-detected)
5. Build Command: `npm run build` (default — installs root deps via `vercel.json`, compiles backend, then Next.js)

### 3. Add environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Required |
|----------|----------|
| `THE_GRAPH_API_KEY` | Yes |
| `HEDERA_ACCOUNT_ID` | Yes |
| `HEDERA_PRIVATE_KEY` | Yes |
| `RESEARCH_PAYMENT_RECIPIENT` | For research purchases (dashboard) |
| `RESEARCH_PRICE_HBAR` | Optional (default: 1) |
| `HEDERA_PRIVATE_KEY_TYPE` | Optional (`ecdsa` / `ed25519` / `der`) |
| `FACILITATOR_URL` | For x402 on public API |
| `X402_PAY_TO` | For x402 on public API |
| `HCS_RECEIPT_TOPIC_ID` | Optional HCS receipts |

Deploy the facilitator separately (Railway/Render) — do not put `FACILITATOR_PRIVATE_KEY` on Vercel.

Use **Testnet** credentials only for demos.

### 4. Deploy

Click Deploy. The build will:

1. Install root backend dependencies
2. Compile `graph/`, `hedera/`, `src/` → `dist/`
3. Copy `dist/` into `frontend/backend-dist/` (bundled with serverless functions)
4. Build the Next.js app

### Vercel plan notes

- **Hobby**: Serverless functions timeout at **10 seconds**. Slow tools (`market_summary`, `compare_multiple_protocols`) may fail when The Graph is slow.
- **Pro**: Supports up to **60 seconds** (`maxDuration` is configured). Recommended for hackathon demos with live data.

### Troubleshooting

| Error | Fix |
|-------|-----|
| `ChainPilot backend not found` | Ensure `npm run build` runs (not a custom command that skips backend prep) |
| `Missing THE_GRAPH_API_KEY` | Add env vars in Vercel dashboard |
| Function timeout | Upgrade to Pro or cache/warm endpoints |
| `@hashgraph/sdk` errors | Already listed in `serverExternalPackages` |

### Local vs Vercel

| | Local | Vercel |
|---|-------|--------|
| Backend path | `../dist` or `backend-dist` | `backend-dist` (copied at build) |
| Env vars | `../.env` | Vercel Environment Variables |
| MCP server | Run separately via stdio | Not needed — API routes call same logic |
