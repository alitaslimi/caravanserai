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

## Field note

In the session, a token already present in the mart through its vault NAV was treated as an existing token when a market feed was added. The catch-up logic skipped the new feed's historical rows because it checked the token at the merged level. Track coverage per source and token so a newly qualified feed can trigger a repair. A rebuilt NAV input also revised history beyond the published model's three-hour rewrite window. Compare both outputs outside the recent window before declaring a migration complete.

## Lab

Give one token three hourly NAV prices and add a market price for the oldest hour. Apply a market-first policy with a one-hour refresh window. Find the row that stays stale and use its hour as the start of a bounded reprice. Verify that the source changes only where the candidate is valid.
