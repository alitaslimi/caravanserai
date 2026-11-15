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
time: "55 minutes"
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

## Repair note

Use chunked range scans to isolate missing or duplicate keys, reuse the model's compiled logic where practical, and count candidate writes before changing data. An insert-triggered materialized view that was absent during a raw replay needs a separate catch-up path. Normalize nullable and non-nullable values to aligned types before interpreting checksum differences.

## Lab

Use three layers with a two-day lookback. Inject a missing raw key seven days in the past. Add the key to raw and show which consumers still miss it. Repair the smallest affected ranges in dependency order and run the repair twice. Verify the final natural keys and payloads.

## Build a repair manifest

Record the reason, source range, accepted block identities, affected logical keys, model revisions, downstream relations, and planned validation before mutating data. Derive each consumer range from its transformation semantics. A daily aggregate may need whole affected days; a rolling seven-day metric can extend six days beyond the repaired event.

Pause or coordinate live writers when the chosen strategy replaces shared partitions. Airflow pools can serialize writers, but the data contract must still state which run owns the range. Keep raw correction, semantic replay, aggregate rebuild, cache invalidation, and publication recovery as distinct status transitions.

## Failure drill

Make the second consumer a rolling metric and the third a cached endpoint. Repair the old raw key but intentionally skip aggregate propagation. The source check should pass while the publication reconciliation still fails. Complete the dependency walk, rerun the same repair, and prove idempotency at each layer.

## Acceptance criteria

- Candidate rows and partitions are measured before each write.
- The repair boundary accounts for windowed downstream logic.
- Live and repair writers cannot silently race.
- Every layer is reconciled at the same cutoff and model revision.
- A second identical repair changes no logical output.
