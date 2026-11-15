---
title: "Local Analytics Stack"
phase: "Orientation & Local Tooling"
phaseNumber: 0
lessonNumber: 1
type: "Build"
status: "draft"
tools: ["DuckDB", "Postgres", "Python", "dbt"]
chains: []
protocols: []
datasets: []
time: "90 minutes"
---

# Local Analytics Stack

## Why It Matters

Onchain analytics starts with a practical loop: load data, inspect it, transform it, test assumptions, and publish a result someone can trust. Before working with live protocol data, you need a local stack that lets you practice that loop without waiting on production infrastructure.

This lesson establishes the shape of that stack. The exact tools can change, but the responsibilities stay stable: a place to store data, a way to query it, a way to transform it, and a way to document what happened.

## Outcomes

- Identify the role of DuckDB, Postgres, Python, and dbt in an analytics workflow.
- Sketch a local project layout for raw data, models, and outputs.
- Run a tiny SQL sanity check before introducing real chain data.

## The Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Local files | CSV or Parquet | Cheap fixtures and exports |
| Analytical query | DuckDB | Fast local SQL over files |
| Service database | Postgres | Durable relational database |
| Transformations | dbt | Tested, documented SQL models |
| Scripting | Python | Ingestion helpers and checks |

## Minimal Sanity Check

Start with the smallest possible query. The first win is not a dashboard; it is proving that your environment can run SQL predictably.

```sql
select
  'onchain analytics' as domain,
  current_date as checked_on;
```

Then write down the answer in `outputs/README.md`. Small habits compound: every serious pipeline is built from tiny checks that are easy to rerun.

## Analyst Notes

When you introduce blockchain data, always ask:

- What is the grain of this table?
- Is the data raw, decoded, normalized, or modeled?
- Which chain and block range does it cover?
- Can this query be rerun tomorrow with the same result?

## Lab

Create a local scratch database, run the sanity query above, and record the result. In a later lesson, this becomes the place where raw blocks, transactions, logs, and traces are loaded before modeling.

For the complete version of this lab, use `examples/reference-stack`. Start ClickHouse, run the dbt build against the synthetic EVM fixture, and inspect the daily metric. Add the optional Airflow profile only after the warehouse path passes. This progression keeps setup failures separate from orchestration failures.

The reference stack deliberately includes a duplicate-injection drill and range-boundary tests. Preserve the failing check, repair command, and passing rerun as evidence rather than reporting only the final green state.

## Next Steps

The next lessons should connect this local setup to wallets, RPC endpoints, block explorers, and the first tiny onchain datasets.
