---
title: "Propagating a historical backfill"
phase: "Production Pipelines"
phaseNumber: 7
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["ClickHouse","dbt","Airflow"]
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Propagating a historical backfill

## Follow the repair through the dependencies

A corrected raw batch may predate every downstream model's lookback. For each consumer, determine whether the normal run reads that range, whether an insert triggers propagation, and whether old output must be replaced. Record the exact model revision and rebuild order.

```flow
{
  "caption": "Repair sequence when a raw range predates downstream watermarks.",
  "steps": [
    "Measure the missing raw keys",
    "Dry run the bounded repair",
    "Write and verify the raw range",
    "Repair consumers that skip the range",
    "Reconcile published counts and values"
  ]
}
```

## Field note

The historical repair session used a chunked scan of 255 ranges to isolate missing or duplicate keys. It reused the model's compiled SQL for the repair and counted candidate inserts first. A materialized view that was absent during a raw backfill needed its own repair. The investigation also found that a checksum could differ because nullable and non-nullable values had different types, so the comparison normalized types before interpreting the result.

## Lab

Use three layers with a two-day lookback. Inject a missing raw key seven days in the past. Add the key to raw and show which consumers still miss it. Repair the smallest affected ranges in dependency order and run the repair twice. Verify the final natural keys and payloads.
