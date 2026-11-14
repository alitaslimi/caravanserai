---
title: "When a keyed replacement creates duplicates"
phase: "Transformation and Incremental Modeling"
phaseNumber: 5
lessonNumber: 2
type: "Case Study"
status: "draft"
tools: ["dbt", "ClickHouse"]
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# When a keyed replacement creates duplicates

## Verify the result of each write

A delete-and-insert strategy depends on the delete seeing the same replacement keys as the insert. In a replicated warehouse, the delete's subquery can read the staged key set before it is visible to the replica executing the mutation. The insert then adds replacement rows alongside surviving old rows. A completed mutation and successful model run establish that statements ran; only a key audit establishes the resulting grain.

```flow
{
  "caption": "A possible failure path for keyed replacement on a replicated warehouse.",
  "steps": ["Stage replacement rows", "Delete reads an incomplete key set", "Old rows survive", "Insert adds new rows", "Key audit finds duplicates"]
}
```

## Verification note

A clean observation window after an adapter or configuration change is evidence, not a guarantee. Record the adapter version and effective scheduler configuration, then monitor new duplicate keys per run. Test the exact engine and topology used in production with synthetic data; do not infer distributed visibility semantics from a single-node test.

## Lab

In a scratch dataset, start with one row per key. Simulate a replacement of two keys with one missing from the delete's input. Compare total rows, distinct keys, and payloads for the surviving versions. Repeat with a full partition replacement, checking that the replacement includes keys untouched by the original update.
