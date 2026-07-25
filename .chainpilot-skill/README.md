# ChainPilot Skill

Reusable **Cursor Skill** for AI-native DeFi research using live blockchain data from [The Graph](https://thegraph.com/) via the [ChainPilot](https://github.com/sukantg/chainpilot) MCP server.

> **Developer infrastructure, not an end-user app.** Install once, use in any project with ChainPilot MCP configured.

---

## Purpose

ChainPilot Skill teaches AI coding agents to:

- Query **live on-chain metrics** (TVL, volume, transaction count)
- **Compare DeFi protocols** objectively
- Generate **structured market reports** without hallucinating data
- Standardize DeFi research workflows across projects

Ask naturally:

- *"Compare the top lending protocols."*
- *"Analyze the largest DEXs."*
- *"Generate a DeFi market report."*
- *"Show TVL rankings."*
- *"Compare Aave, Compound, Morpho and Spark."*

The skill routes requests to ChainPilot MCP tools automatically.

---

## Architecture

```
User Prompt
    ↓
Cursor Skill (SKILL.md)
    ↓
ChainPilot MCP Server
    ↓
The Graph (subgraphs)
    ↓
Live blockchain data
    ↓
Structured research output
```

---

## Installation

### 1. Clone ChainPilot and configure MCP

```bash
git clone https://github.com/sukantg/chainpilot.git
cd chainpilot
cp .env.example .env
# Edit .env with your API keys (see below)
npm install
npm run build
```

### 2. Register ChainPilot MCP in Cursor

Add to Cursor **Settings → MCP** (or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "chainpilot": {
      "command": "node",
      "args": ["dist/src/index.js"],
      "cwd": "/absolute/path/to/chainpilot"
    }
  }
}
```

Or use the dev command:

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

### 3. Install the skill

**Option A — Project skill (recommended for teams)**

```bash
cp -r .chainpilot-skill .cursor/skills/chainpilot
```

**Option B — Personal skill (all projects)**

```bash
cp -r .chainpilot-skill ~/.cursor/skills/chainpilot
```

**Option C — Reference from repo**

Symlink or copy `.chainpilot-skill/SKILL.md` into your skills directory.

### 4. Enable in Cursor

Skills are discovered automatically from:

- `.cursor/skills/*/SKILL.md` (project)
- `~/.cursor/skills/*/SKILL.md` (personal)

Restart Cursor or reload the window after installing.

---

## Required MCP server

| Component | Requirement |
|-----------|-------------|
| MCP server | ChainPilot (`chainpilot` in MCP config) |
| Node.js | ≥ 20 |
| The Graph | API key with subgraph access |
| Hedera | Testnet credentials (wallet + research tools only) |

Start locally:

```bash
npm run dev          # MCP server (stdio)
npm run inspect      # MCP Inspector UI
```

---

## Required environment variables

Create `.env` at the ChainPilot repo root:

| Variable | Required for | Description |
|----------|--------------|-------------|
| `THE_GRAPH_API_KEY` | All protocol metrics | [The Graph](https://thegraph.com/studio/) API key |
| `HEDERA_ACCOUNT_ID` | Wallet, research | Hedera Testnet account ID |
| `HEDERA_PRIVATE_KEY` | Wallet, research | Hedera Testnet private key |
| `RESEARCH_PAYMENT_RECIPIENT` | `purchase_research` | Payment recipient account |
| `RESEARCH_PRICE_HBAR` | `purchase_research` | Minimum price (default: 1) |

---

## Supported protocol categories

| Category | Protocols (live) | Status |
|----------|------------------|--------|
| DEX | Uniswap, Curve | Supported |
| Lending | Aave | Supported |
| DEX (extended) | SushiSwap, Balancer | Planned |
| Lending (extended) | Compound, Morpho, Spark | Planned |

Always call `list_protocols` for the current list.

---

## Supported MCP tools

### Live

| Tool | Description |
|------|-------------|
| `hello` | MCP health check |
| `list_protocols` | Supported protocols with display names |
| `get_protocol` | Live metrics for one protocol |
| `compare_multiple_protocols` | Compare 2+ protocols with leaders |
| `market_summary` | Market-wide rankings and leaders |
| `purchase_research` | Paid markdown research report (HBAR) |
| `wallet_balance` | HBAR balance |
| `transfer_hbar` | Send HBAR on Testnet |

### Planned

| Tool | Workaround |
|------|------------|
| `list_categories` | Use `list_protocols` |
| `compare_protocols` | Use `compare_multiple_protocols` with 2 IDs |
| `compare_category` | Use `compare_multiple_protocols` on category members |
| `top_protocol_by_metric` | Use `market_summary` rankings |

---

## Example prompts

See [prompts.md](prompts.md) for copy-paste templates.

| Prompt | Primary tool |
|--------|--------------|
| Analyze the current DEX market | `compare_multiple_protocols` + `market_summary` |
| Compare every lending protocol | `compare_multiple_protocols` |
| Generate a TVL ranking | `market_summary` |
| Which protocol has the highest volume? | `market_summary` |
| Produce an investment research report | `compare_multiple_protocols` + report template |
| Generate a Markdown report | Research template or `purchase_research` |

---

## Expected outputs

### JSON (raw tool data)

```json
{
  "protocols": [
    { "name": "Uniswap", "totalValueLockedUSD": "...", "totalVolumeUSD": "...", "txCount": "..." }
  ],
  "leaders": { "tvl": "Uniswap", "volume": "Curve", "transactions": "Uniswap" },
  "recommendation": "Uniswap is the strongest overall choice..."
}
```

### Markdown report

Structured sections: Executive Summary, Market Overview, Metrics Table, Strengths, Weaknesses, Recommendation, Risks, Conclusion.

See [SKILL.md](SKILL.md) for the full template.

---

## File structure

```
.chainpilot-skill/
├── SKILL.md       # Agent instructions (required for Cursor)
├── prompts.md     # Reusable prompt templates
├── examples.md    # Example conversations
└── README.md      # This file
```

---

## Design goals

- **Reusable** — any developer, any project with ChainPilot MCP
- **Live data** — The Graph subgraphs, no mocked metrics
- **Accurate** — agents must call tools, not hallucinate
- **Standardized** — consistent research workflow and report format
- **Low prompt engineering** — skill encodes best practices

---

## Frontend demo

ChainPilot includes a Next.js dashboard in `frontend/` for hackathon demos. It calls the same backend logic via `/api/mcp`. See [frontend/README.md](../frontend/README.md).

---

## License

MIT — same as ChainPilot.
