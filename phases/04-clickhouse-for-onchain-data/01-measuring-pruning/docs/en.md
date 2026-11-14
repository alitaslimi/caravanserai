---
title: "Measuring warehouse scan cost"
phase: "Warehousing Onchain Data"
phaseNumber: 4
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["ClickHouse","dbt"]
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Measuring warehouse scan cost

## Compare work as well as latency

For a warehouse query, record the predicates, rows and bytes read, peak memory, and elapsed time. Compare queries at the same cutoff and validate output equality. A faster elapsed time can coexist with more work, especially when caching or concurrency differs.

## Field note

One ClickHouse rewrite made block bounds arrive through a join and read 42% more bytes even though elapsed time improved. The repair rendered bounded predicates for the sort-key prefix and measured bytes read again. In another session, an ingestion range ledger returned an old block-zero range. It pushed a quiet incremental model back to a full scan until that range aged out.

```bars
{
  "caption": "Observed ClickHouse scans in the ingested-ranges session. Each bar is the share of granules read in its own run. Different model states are shown, so this is not a controlled latency benchmark.",
  "unit": "%",
  "max": 100,
  "rows": [
    [
      "Quiet model after backfill (2929/2929)",
      100
    ],
    [
      "Busy model (49/2921)",
      1.68
    ],
    [
      "Quiet model after the range expired (84/2924)",
      2.87
    ]
  ]
}
```

## Lab

Compare a literal predicate on the sort-key prefix with an equivalent predicate derived from a small join. Inspect both plans and runtime scan counters. Repeat with an empty set of ranges and verify that it produces no scan rather than an unbounded query.
