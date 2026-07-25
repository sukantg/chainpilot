# ChainPilot

**AI-native DeFi research powered by live on-chain data and Hedera micropayments.**

ChainPilot is an MCP (Model Context Protocol) server that lets AI agents query live DeFi metrics from [The Graph](https://thegraph.com/), compare protocols objectively, and purchase markdown research reports with HBAR on Hedera Testnet. A Next.js dashboard provides a visual demo for judges and developers.

---

## Problem

AI coding agents frequently hallucinate Total Value Locked, volume, and transaction counts when asked about DeFi protocols. Developers need a reliable, tool-driven workflow that returns **live blockchain data** — and a way to monetize premium research without traditional payment rails.

## Solution

ChainPilot connects AI agents to The Graph subgraphs for real protocol metrics, exposes those capabilities as MCP tools, and uses **Hedera Testnet HBAR transfers** to gate paid research reports. Agents get structured, deterministic comparisons; users get auditable on-chain payment receipts.

### Why Hedera?

| Capability | Role in ChainPilot |
|------------|-------------------|
| **Fast finality** | Research reports delivered immediately after payment confirms |
| **Low fees** | Micropayments (default 1 ℏ) are viable for per-report pricing |
| **Native transfers** | `purchase_research` uses `TransferTransaction` — no smart contract required for MVP |

---

## Features

- **Live DeFi metrics** — TVL, volume, and transaction counts from The Graph (no mocked data)
- **8 MCP tools** — protocol discovery, comparison, market summary, wallet ops, paid research
- **Reusable Cursor Skill** — standardized agent workflows in `.chainpilot-skill/`
- **Next.js dashboard** — visual client for demos, wallet management, and a Developer Console
- **Paid research reports** — pay HBAR → receive a deterministic markdown comparison report

### Supported protocols

| ID | Name | Category |
|----|------|----------|
| `uniswap` | Uniswap | DEX |
| `aave` | Aave | Lending |
| `curve` | Curve | DEX / Stableswap |

---

## Architecture

```
User / AI Agent
      ↓
Cursor Skill (.chainpilot-skill/)  or  Next.js Dashboard (frontend/)
      ↓
ChainPilot MCP Server (src/index.ts)  or  POST /api/mcp
      ↓
┌─────────────────────┬──────────────────────┐
│  The Graph          │  Hedera Testnet      │
│  (subgraphs)        │  (HBAR transfers)    │
└─────────────────────┴──────────────────────┘
      ↓                        ↓
Live protocol metrics    Payment + receipt in report
```

The frontend is a **visual client only** — it calls the same backend modules as the MCP server, with no duplicated business logic.

---

## Quick start

### Prerequisites

- Node.js 20+
- [The Graph](https://thegraph.com/studio/) API key
- Hedera Testnet account ([portal.hedera.com](https://portal.hedera.com/))

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `THE_GRAPH_API_KEY` | Yes | The Graph API key |
| `HEDERA_ACCOUNT_ID` | Yes | Hedera Testnet account ID |
| `HEDERA_PRIVATE_KEY` | Yes | Hedera Testnet private key |
| `RESEARCH_PAYMENT_RECIPIENT` | For research | Payment recipient account |
| `RESEARCH_PRICE_HBAR` | No | Minimum price (default: `1`) |
| `HEDERA_PRIVATE_KEY_TYPE` | No | `ecdsa`, `ed25519`, or `der` |

### 2. Install and build

```bash
npm install
npm run build
```

### 3. Run the MCP server

```bash
npm run dev          # stdio MCP server
npm run inspect      # MCP Inspector UI
```

### 4. Run the dashboard (optional)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Register MCP in Cursor

Add to `.cursor/mcp.json` (or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "chainpilot": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/chainpilot"
    }
  }
}
```

Install the Cursor Skill:

```bash
cp -r .chainpilot-skill .cursor/skills/chainpilot
```

---

## MCP tools

| Tool | Description |
|------|-------------|
| `hello` | Health check |
| `list_protocols` | Supported protocols with display names |
| `get_protocol` | Live metrics for one protocol |
| `compare_multiple_protocols` | Compare 2+ protocols with leaders and recommendation |
| `market_summary` | Rankings and market leaders across all protocols |
| `purchase_research` | Pay HBAR and receive a markdown research report |
| `wallet_balance` | Hedera Testnet HBAR balance |
| `transfer_hbar` | Send HBAR on Hedera Testnet |

Example agent prompts:

- *"List supported protocols"*
- *"Compare Uniswap and Aave"*
- *"Show TVL rankings"*
- *"Purchase a research report comparing Curve and Uniswap"*

---

## Dashboard routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with live stats |
| `/protocols` | Protocol explorer — live KPI metrics |
| `/compare` | Two-protocol comparison with charts |
| `/compare-multiple` | Multi-protocol rankings |
| `/market` | Market overview and rankings |
| `/research` | Purchase markdown research reports (HBAR) |
| `/wallet` | HBAR balance and transfers |
| `/developer` | MCP tool console for testing |
| `/settings` | Integration overview |

See [frontend/README.md](frontend/README.md) for Vercel deployment and troubleshooting.

---

## Project structure

```
chainpilot/
├── src/                  # MCP server entry point and tools
├── graph/                # The Graph client, config, comparisons, reports
├── hedera/               # Hedera Testnet wallet (balance, transfers)
├── frontend/             # Next.js dashboard
├── .chainpilot-skill/    # Reusable Cursor Skill for AI agents
└── .env.example          # Environment template
```

---

## Hedera integration

ChainPilot uses `@hashgraph/sdk` v2.81 on **Hedera Testnet**:

- **`AccountBalanceQuery`** — wallet balance for `wallet_balance`
- **`TransferTransaction`** — HBAR payments for `purchase_research` and `transfer_hbar`

The `purchase_research` flow:

1. Verify wallet balance meets the required price
2. Execute HBAR transfer to the payment recipient
3. Fetch live protocol comparison from The Graph
4. Return a markdown report with payment details (transaction ID, timestamp)

---

## Development

```bash
npm run build          # Compile TypeScript → dist/
npm run dev            # Run MCP server via tsx
npm run inspect        # Launch MCP Inspector
```

Frontend lint:

```bash
cd frontend && npm run lint
```

---

## Documentation

- [Frontend setup & deployment](frontend/README.md)
- [Cursor Skill guide](.chainpilot-skill/README.md)
- [Example agent conversations](.chainpilot-skill/examples.md)
- [Reusable prompt templates](.chainpilot-skill/prompts.md)

---

## License

MIT
