---
title: "Debugging a stale dashboard"
phase: "Publishing Analytics"
phaseNumber: 10
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["ClickHouse","Airflow"]
chains: []
protocols: []
datasets: []
time: "45 minutes"
---

# Debugging a stale dashboard

## Trace a chart back to the last complete period

Check the dashboard query, the relation it reads, the job that writes that relation, and the upstream data cutoff. Compare the current day only after confirming that every input is complete. Use an overlapping historical window to test a query rewrite.

```flow
{
  "caption": "Investigate both freshness and correctness before changing the chart query.",
  "steps": [
    "Identify the dashboard relation",
    "Find its last complete data period",
    "Compare old and new queries on overlap",
    "Reconcile with an independent source",
    "Publish the freshness cutoff"
  ]
}
```

## Failure pattern

A dashboard can remain stale while upstream intermediates are current if it reads an unscheduled or retired mart. Separately, a fresh table can still be wrong because of duplicate or missing keys. Diagnose freshness from the exact relations and executed query revision, then run correctness checks independently. Do not treat a recent timestamp as proof of accurate values.

Check label uniqueness before joining. With the ClickHouse settings used in the session, an unmatched string could be empty rather than NULL. Normalize missing labels before applying an Other bucket.

## Lab

Compare old and new dashboard queries on three complete days. Add a partial fourth day and a duplicate label key. Report freshness, row multiplication, and any independent reconciliation gap separately.

## Freshness chain

Record four boundaries for the exact metric revision: accepted source cutoff, transformed cutoff, publication cutoff, and cache generation time. Compare block identities as well as timestamps. A recently generated response can still serve a stale model, and a current model can still be hidden behind an old cache entry.

Trace the actual executed query or stable fingerprint. Dashboard editors, semantic layers, scheduled extracts, and API endpoints can each reference a different relation from the one an operator expects. Verify environment, database, schema, and model revision before changing SQL.

## Failure drill

Keep ingestion current while freezing the published mart, then refresh the cache. The response generation time should advance while its data cutoff remains stale. Next, repair the mart but leave a duplicate label winner; freshness should recover while correctness still fails. The incident report must keep those two states separate.

## Acceptance criteria

- Every displayed metric exposes or links to its data cutoff.
- Complete periods are distinguished from partial current periods.
- Headline and grouped values reconcile under identical filters.
- Cache age and source-data age are independently observable.
- Missing labels do not multiply rows or silently disappear.
