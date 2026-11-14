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

## Failure pattern

A block bound expressed as a literal or scalar predicate can prune the leading sort-key range, while an equivalent bound derived through a join may not. An ingestion-range ledger can also make a quiet model scan old history when one broad replay range remains eligible. Compare plans and scan counters, and test an empty range set so it produces no source scan rather than an unbounded fallback.

```bars
{
  "caption": "Synthetic scan shares for three watermark states. These demonstrate the comparison method, not a production benchmark.",
  "unit": "%",
  "max": 100,
  "rows": [
    [
      "Quiet model after broad replay",
      100
    ],
    [
      "Busy model near source tip",
      2
    ],
    [
      "Quiet model after replay range expires",
      3
    ]
  ]
}
```

## Lab

Compare a literal predicate on the sort-key prefix with an equivalent predicate derived from a small join. Inspect both plans and runtime scan counters. Repeat with an empty set of ranges and verify that it produces no scan rather than an unbounded query.
