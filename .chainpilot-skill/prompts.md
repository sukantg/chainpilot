# ChainPilot Prompt Templates

Reusable prompt patterns for DeFi research with ChainPilot MCP. Copy, adapt, or invoke directly.

---

## Market analysis

### Analyze the current DEX market

```
Use ChainPilot MCP:
1. list_protocols — filter DEX protocols (uniswap, curve)
2. compare_multiple_protocols — compare all DEX protocols
3. market_summary — overall rankings

Produce a Markdown report with Executive Summary, Metrics Table, and Recommendation.
Only use live tool data.
```

### Generate a DeFi market report

```
Call market_summary via ChainPilot MCP.
Format the full research template: Executive Summary, Market Overview, Metrics Table,
Strengths, Weaknesses, Recommendation, Risks, Conclusion.
Include TVL, volume, and transaction rankings.
```

### Show TVL rankings

```
Call market_summary and present rankingByTvl as a numbered list.
Include raw TVL values and highlight the leader.
```

---

## Protocol comparison

### Compare specific protocols

```
Compare [protocolA], [protocolB], [protocolC] using compare_multiple_protocols.
Create a metrics table and explain the recommendation field.
State which protocol wins TVL, volume, and transactions.
```

**Example:** Compare Aave, Compound, Morpho and Spark.

```
First call list_protocols. Compare all supported matches with compare_multiple_protocols.
For unsupported names, state they are not available and compare supported lending/DEX alternatives.
```

### Compare two protocols head-to-head

```
Use compare_multiple_protocols with exactly two protocol IDs.
Include winner badges per metric and the deterministic recommendation.
```

### Compare every supported protocol

```
1. list_protocols
2. compare_multiple_protocols with all returned IDs
3. Summarize leaders and overall strongest protocol
```

---

## Metric queries

### Which protocol has the highest volume?

```
Call market_summary. Report highestVolume name and value.
Optionally show rankingByVolume for full context.
```

### Compare protocols by transaction count

```
Call compare_multiple_protocols or market_summary.
Rank by transaction count using rankingByTransactions or txCount fields.
```

### Top protocol by TVL

```
Call market_summary. Report highestTvl and rankingByTvl.
Use for "largest", "biggest", or "dominant" protocol questions.
```

---

## Single protocol deep dive

### Show live metrics for one protocol

```
Call get_protocol with protocol ID "[id]".
Present TVL, volume, and transaction count as KPIs.
Note the data is live from The Graph.
```

---

## Research reports

### Produce an investment research report

```
1. list_protocols — confirm scope
2. compare_multiple_protocols — fetch live comparison
3. Format full Markdown report using ChainPilot research template

Do not invent metrics. Include Risks section noting subgraph data limitations.
```

### Generate a Markdown report (paid)

```
Use purchase_research with protocolA, protocolB, and amount in HBAR.
Return the markdown report verbatim with payment details.
Only when user confirms payment intent.
```

---

## Category analysis (planned)

Until `list_categories` and `compare_category` ship, use these patterns:

### Compare every lending protocol

```
Compare supported lending protocols via compare_multiple_protocols(["aave"]).
Note additional lending protocols will be added; list_protocols shows current scope.
```

### Analyze the largest DEXs

```
compare_multiple_protocols(["uniswap", "curve"])
market_summary for broader DEX ranking context
```

---

## Explainer prompts

### Explain why one protocol ranks above another

```
Using the last compare_multiple_protocols or market_summary result,
explain metric wins: which protocol leads TVL, volume, and transactions.
Reference the recommendation field. No speculation beyond metrics.
```

### Why is [protocol] recommended?

```
Cite the recommendation string from compare_multiple_protocols.
Break down leaders.tvl, leaders.volume, leaders.transactions.
```

---

## Developer / MCP prompts

### Verify ChainPilot connection

```
Call hello and list_protocols. Confirm MCP is responding and report protocol count.
```

### Run developer console workflow

```
1. list_protocols — show request/response JSON
2. get_protocol("uniswap") — show live metrics
3. market_summary — show full market JSON
Report execution time if available.
```
