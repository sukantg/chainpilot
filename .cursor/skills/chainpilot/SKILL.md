---
name: chainpilot
description: >-
  Perform DeFi research using live blockchain data from The Graph via ChainPilot
  MCP tools. Use when the user asks to compare protocols, analyze DEXs or lending
  markets, generate TVL rankings, produce market reports, or research on-chain
  metrics. Never hallucinate TVL, volume, or transaction counts — always call
  ChainPilot MCP tools first.
---

# ChainPilot Skill

Reusable Cursor Skill for AI-native DeFi research powered by live on-chain data.

## Purpose

ChainPilot Skill is a reusable Cursor Skill that helps AI agents perform DeFi research using live blockchain data from **The Graph** through the **ChainPilot MCP**.

The skill instructs the agent to **always prefer live protocol data** instead of hallucinating metrics. ChainPilot is developer infrastructure — it works with any project that has the ChainPilot MCP server configured.

## Architecture

```
User Prompt
    ↓
Cursor Skill (this file)
    ↓
ChainPilot MCP
    ↓
The Graph
    ↓
Live blockchain data
    ↓
Structured research
```

## Supported MCP tools

### Available now

| Tool | Purpose |
|------|---------|
| `hello` | Health check — verify MCP connection |
| `list_protocols` | Discover supported protocols and display names |
| `get_protocol` | Live TVL, volume, and transaction count for one protocol |
| `compare_multiple_protocols` | Compare 2+ protocols with leaders and recommendation |
| `market_summary` | Rankings and market leaders across all supported protocols |
| `purchase_research` | Pay HBAR and receive a deterministic markdown research report |
| `wallet_balance` | Hedera Testnet HBAR balance |
| `transfer_hbar` | Send HBAR on Hedera Testnet |

### Planned (use workarounds below)

| Tool | Workaround today |
|------|------------------|
| `list_categories` | Call `list_protocols`; categories coming soon |
| `compare_protocols` | Use `compare_multiple_protocols` with exactly 2 protocols |
| `compare_category` | Use `compare_multiple_protocols` on known protocols in that category |
| `top_protocol_by_metric` | Use `market_summary` (`highestTvl`, `highestVolume`, `rankingBy*`) |

### Currently supported protocols

| ID | Name | Category |
|----|------|----------|
| `uniswap` | Uniswap | DEX |
| `aave` | Aave | Lending |
| `curve` | Curve | DEX / Stableswap |

Always call `list_protocols` before comparing. If the user names unsupported protocols (e.g. Compound, Morpho, SushiSwap), state they are not yet available and offer to compare supported alternatives.

## Default workflow

Whenever a user asks about DeFi protocols:

1. **Discover** — call `list_protocols` to confirm supported protocols
2. **Fetch** — call `get_protocol` or `compare_multiple_protocols` for live metrics
3. **Compare** — use leaders, rankings, and deterministic recommendations from tool output
4. **Summarize** — format findings using the research template below
5. **Recommend** — cite objective metrics (TVL, volume, transaction count wins)
6. **Never fabricate** TVL, volume, or transaction counts

### Tool selection guide

| User intent | Tool |
|-------------|------|
| "What protocols do you support?" | `list_protocols` |
| "Show Uniswap metrics" | `get_protocol` |
| "Compare A and B" | `compare_multiple_protocols` with 2 IDs |
| "Compare A, B, C, D" | `compare_multiple_protocols` with all IDs |
| "Best / largest / market overview" | `market_summary` |
| "TVL rankings" | `market_summary` → `rankingByTvl` |
| "Highest volume" | `market_summary` → `highestVolume` |
| "Investment research report" | `compare_multiple_protocols` + format report, or `purchase_research` for paid report |
| "Generate markdown report" | Format tool output using research template |

## Research template

Every report must use this structure. Populate sections **only** from MCP tool output.

```markdown
# Executive Summary

Brief overview of protocols analyzed and the key finding.

# Market Overview

Context from `market_summary` or comparison scope. State data source and timestamp.

# Metrics Table

| Protocol | TVL | Volume | Transactions |
|----------|-----|--------|--------------|
| ...      | ... | ...    | ...          |

# Strengths

Bullet points per protocol — only metrics where the protocol leads or ties.

# Weaknesses

Bullet points per protocol — only metrics where the protocol trails.

# Recommendation

Use the deterministic `recommendation` field from comparison tools, or derive from metric wins.

# Risks

Note data limitations: subgraph lag, supported protocol scope, single-chain coverage, etc.

# Conclusion

One paragraph summary with actionable takeaway.
```

## Rules

1. **Always use live MCP data** — call tools before answering metric questions
2. **Never invent protocol metrics** — if data is missing, say so explicitly
3. **State when data is unavailable** — unsupported protocols, API errors, missing env vars
4. **Prefer `compare_multiple_protocols`** for three or more protocols (or two)
5. **Use `market_summary`** whenever the user asks about "best", "largest", "top", or "rankings"
6. **Call `list_protocols` first** when protocol names are ambiguous
7. **Use protocol IDs** in tool calls (`uniswap`, not "Uniswap") unless the tool accepts display names
8. **Preserve raw values** from tools — do not round or estimate unless formatting for readability (label approximations)

## Output formats

### JSON tool responses

Return or reference structured JSON from MCP tools when the user wants raw data.

### Markdown reports

Use the research template for human-readable deliverables.

### Paid research

Use `purchase_research` only when the user explicitly requests a paid report with HBAR payment. Requires Hedera wallet configuration.

## Additional resources

- Reusable prompt templates: [prompts.md](prompts.md)
- Example conversations: [examples.md](examples.md)
- Installation and setup: [README.md](README.md)
