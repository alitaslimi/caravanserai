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

A delete-and-insert strategy depends on the delete seeing the same replacement keys as the insert. In one replicated warehouse incident, the delete's subquery read the incoming key set before it was visible to that replica. The insert then added the replacement rows alongside the old rows. A completed mutation and a successful model run both appeared in the logs.

```flow
{
  "caption": "Failure path observed in a replicated ClickHouse deployment.",
  "steps": ["Stage replacement rows", "Delete reads an incomplete key set", "Old rows survive", "Insert adds new rows", "Key audit finds duplicates"]
}
```

## Field note

The initial comparison found duplicate-producing runs in 7 of 180 runs before an adapter upgrade and 0 of 188 during the upgrade test. The later notes recorded a recurrence. Use that sequence to distinguish a clean observation window from a guarantee. Record which adapter and effective configuration the scheduler actually ran.

## Lab

In a scratch dataset, start with one row per key. Simulate a replacement of two keys with one missing from the delete's input. Compare total rows, distinct keys, and payloads for the surviving versions. Repeat with a full partition replacement, checking that the replacement includes keys untouched by the original update.
