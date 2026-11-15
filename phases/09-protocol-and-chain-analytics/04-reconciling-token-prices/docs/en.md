---
title: "Reconciling token price sources"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 4
type: "Case Study"
status: "draft"
tools: ["dbt"]
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Reconciling token price sources

## Keep token identity separate from price lookup

Key the published price by chain, token, and observation time. Treat a vendor identifier as a mapping to a price feed. A corrected mapping can change historical prices without changing the identity of the token. Record the source, observation time, and staleness limit with the price.

For a vault token, one candidate price is the underlying asset price multiplied by assets per share, with both quantities normalized to compatible units. Compute that candidate from the underlying price feed. If it reads the merged output that will later consume the candidate, the dependency becomes circular.

```flow
{
  "caption": "Independent inputs feed a single published price per token and timestamp.",
  "steps": [
    "Resolve vendor feed and asset identity",
    "Build market and vault price candidates",
    "Check coverage, units, and staleness",
    "Apply source precedence",
    "Record which candidate won"
  ]
}
```

## Source-coverage note

A token already present through one price source is not necessarily complete when a new source becomes eligible. Track progress per source and token rather than only at the merged-token level. When an upstream source revises history beyond the published model's rewrite window, derive and rebuild the affected interval explicitly before declaring the migration complete.

## Lab

Give one token three hourly NAV prices and add a market price for the oldest hour. Apply a market-first policy with a one-hour refresh window. Find the row that stays stale and use its hour as the start of a bounded reprice. Verify that the source changes only where the candidate is valid.

Implement source precedence in `code/price_precedence.sql`. Require one winning candidate per token and hour, retain rejected candidates for audit, and emit staleness plus source coverage beside the price.

## Failure cases to test

- A vendor mapping changes but the incremental model never revisits old hours.
- A vault candidate reads from the merged table it is intended to populate.
- Share price and underlying price use incompatible decimal scales.
- A fresh low-priority source defeats a stale high-priority source without a documented rule.
- A token has candidates but no candidate inside the allowed staleness window.
