# ChainPilot Skill Examples

Realistic conversations demonstrating correct MCP usage. All metrics come from live tool calls — never fabricated.

---

## Example 1: Compare four DEX protocols

**User:** Compare Uniswap, Curve, SushiSwap and Balancer.

**Assistant workflow:**

1. Call `list_protocols`
2. Identify supported matches: `uniswap`, `curve`
3. Inform user SushiSwap and Balancer are not yet supported
4. Call `compare_multiple_protocols` with `["uniswap", "curve"]`

**Sample response:**

> I checked supported protocols via ChainPilot. **Uniswap** and **Curve** are available; SushiSwap and Balancer are not yet in ChainPilot's subgraph index.
>
> ### Metrics Comparison
>
> | Metric | Uniswap | Curve |
> |--------|---------|-------|
> | TVL | *(live value)* | *(live value)* |
> | Volume | *(live value)* | *(live value)* |
> | Transactions | *(live value)* | *(live value)* |
>
> ### Leaders
> - **TVL:** *(from leaders.tvl)*
> - **Volume:** *(from leaders.volume)*
> - **Transactions:** *(from leaders.transactions)*
>
> ### Recommendation
> *(deterministic recommendation from tool output)*

---

## Example 2: Largest lending protocol

**User:** Which lending protocol is the largest?

**Assistant workflow:**

1. Call `list_protocols` — find lending protocols (`aave`)
2. Call `market_summary` for rankings
3. Report `highestTvl` if Aave is in scope, or compare available lending protocols

**Sample response:**

> Based on live data from ChainPilot's `market_summary`:
>
> - **Supported lending protocols:** Aave
> - **Highest TVL overall:** *(market_summary.highestTvl.name)* — *(value)*
>
> Among supported lending protocols, **Aave** is the largest by TVL at *(value)*.
>
> *Note: Compound, Morpho, and Spark are not yet supported. Rankings reflect ChainPilot's current protocol set.*

---

## Example 3: Full market report

**User:** Generate a market report.

**Assistant workflow:**

1. Call `market_summary`
2. Format full research template from JSON response

**Sample response structure:**

```markdown
# Executive Summary

ChainPilot analyzed 3 supported protocols (Uniswap, Aave, Curve) using live
The Graph data. *(Summarize overallStrongestProtocol and key leaders.)*

# Market Overview

*(protocolsAnalyzed, highestTvl, highestVolume, highestTransactionCount)*

# Metrics Table

| Protocol | TVL | Volume | Transactions |
|----------|-----|--------|--------------|
| ...      | ... | ...    | ...          |

# Strengths
...

# Weaknesses
...

# Recommendation
...

# Risks

- Data sourced from The Graph subgraphs; may lag chain state by minutes.
- Only 3 protocols currently supported.
- Metrics are aggregate protocol-level, not chain-wide DeFi totals.

# Conclusion
...
```

---

## Example 4: TVL rankings

**User:** Show TVL rankings.

**Assistant workflow:**

1. Call `market_summary`
2. Present `rankingByTvl` as ordered list

**Sample response:**

> ### TVL Rankings (live)
>
> 1. **Uniswap** — $1.56T
> 2. **Aave** — $10.7B
> 3. **Curve** — $4.6B
>
> *Source: ChainPilot `market_summary`, The Graph.*

---

## Example 5: Compare three protocols

**User:** Compare Aave, Compound, Morpho and Spark.

**Assistant workflow:**

1. `list_protocols`
2. Explain only `aave` is supported
3. Offer to compare Aave against DEX protocols or wait for lending expansion
4. If user agrees: `compare_multiple_protocols(["aave", "uniswap", "curve"])`

---

## Example 6: Single protocol metrics

**User:** What's Uniswap's TVL right now?

**Assistant workflow:**

1. Call `get_protocol` with `{ "protocol": "uniswap" }`

**Sample response:**

> **Uniswap** (live via The Graph):
> - **TVL:** $1,562,790,437,957.57
> - **Volume:** $1,902,311,161,045.78
> - **Transactions:** 143,503,753

---

## Example 7: Highest volume

**User:** Which protocol has the highest volume?

**Assistant workflow:**

1. Call `market_summary`
2. Report `highestVolume`

**Sample response:**

> **Curve** has the highest volume among supported protocols at *(value)*.
> See full volume rankings in `rankingByVolume`.

---

## Example 8: Paid research report

**User:** Purchase a research report comparing Uniswap and Aave for 1 HBAR.

**Assistant workflow:**

1. Confirm Hedera wallet is configured
2. Call `purchase_research` with `{ protocolA: "uniswap", protocolB: "aave", amount: 1 }`
3. Return markdown report from response

---

## Example 9: Explain ranking

**User:** Why does Uniswap rank above Aave overall?

**Assistant workflow:**

1. Call `compare_multiple_protocols(["uniswap", "aave"])`
2. Explain metric wins from `leaders` and `recommendation`

**Sample response:**

> Uniswap leads on **2 of 3 metrics** (TVL and transaction count). Aave leads on volume.
> The deterministic recommendation selects Uniswap because it wins more categories:
>
> *(paste recommendation field)*

---

## Anti-patterns (do not do this)

**User:** What's Aave's TVL?

**Wrong:** "Aave has approximately $10 billion in TVL based on my knowledge."

**Correct:** Call `get_protocol("aave")` and return the live `tvl` field.

---

**User:** Compare Uniswap and SushiSwap.

**Wrong:** Fabricate SushiSwap metrics to complete the table.

**Correct:** Call `list_protocols`, state SushiSwap is unsupported, compare Uniswap with available DEX alternatives.
