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
time: "15 minutes"
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

## Field note

A dashboard was reading an unscheduled mart while hourly intermediates were fresh. The query rewrites matched the old mart where both were complete. A separate comparison against a supply series exposed a different problem. Staging had 1,832 rows where the source had 1,828, including a duplicated large transfer. A smaller residual stayed unexplained after accounting for those duplicates.

Check label uniqueness before joining. With the ClickHouse settings used in the session, an unmatched string could be empty rather than NULL. Normalize missing labels before applying an Other bucket.

## Lab

Compare old and new dashboard queries on three complete days. Add a partial fourth day and a duplicate label key. Report freshness, row multiplication, and any independent reconciliation gap separately.
