---
title: "Designing ClickHouse tables for EVM logs"
phase: "Warehousing Onchain Data"
phaseNumber: 4
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["ClickHouse"]
chains: ["EVM"]
protocols: []
datasets: ["logs", "system.parts", "system.query_log"]
time: "45 minutes"
---

# Designing ClickHouse tables for EVM logs

## Why It Matters

An EVM log table must support sequential ingestion, block-range repair, emitter and signature filters, and large analytical scans. ClickHouse performance depends on the physical order of data and the shape of predicates, not merely on having the queried column somewhere in a key.

## Outcomes

- Choose exact types and a natural log key.
- Design an `ORDER BY` prefix around common range scans.
- Partition only when it materially improves lifecycle operations or pruning.
- Distinguish physical duplicates from logical duplicate keys.
- Benchmark with scan counters and caches controlled.

## Table contract

One row represents one log position in one canonical block observation. A portable logical key is:

```text
(chain_id, block_number, transaction_index, log_index)
```

Keep transaction hash and block hash as payload and validation fields. If the table can contain competing block versions during reorg handling, include the block hash or canonicality version in the storage contract and resolve canonical rows explicitly.

The sample DDL in `code/logs.sql` stores addresses and hashes as fixed bytes. A hex-string boundary can be friendlier for teaching, but fixed-width binary reduces storage and prevents mixed-case address keys.

## Sorting and partitioning

`ORDER BY (chain_id, block_number, transaction_index, log_index)` favors:

- bounded chain and block scans;
- range replay and reconciliation;
- stable event ordering.

It does not make `contract_address = ?` selective by itself. A skip index helps only if most granules contain no match. An actively used emitter may appear in nearly every granule, while a rare `topic0` may be a better index candidate.

Partitioning creates independent parts and a permanent merge floor. Monthly partitions can be useful for retention or bounded replacement on very large tables, but they are often harmful on small or sparse tables. Measure table size, partition count, parts per partition, repair workflow, and representative `FINAL` queries before changing the partition key.

## Replay semantics

MergeTree sorting keys are not uniqueness constraints. Repeating an insert creates another physical row unless the write path prevents it or an engine eventually replaces it. For every replay, compare:

```sql
count()                         -- physical rows
uniqExact(tuple(...key...))     -- logical keys, only on a bounded range
count() - uniqExact(tuple(...)) -- duplicate-key excess
```

For large tables, first use `system.parts` metadata and bounded recent windows. Do not start with an exact whole-table distinct count.

## Query benchmark

Capture:

- `read_rows` and `read_bytes`;
- `result_rows`;
- peak memory;
- elapsed time;
- effective settings and server version;
- whether page, mark, query, or query-condition caches were warm.

Disable the query-condition cache for predicate A/B comparisons. Run each candidate against the same cutoff and verify equal keys and values before comparing cost.

## Lab

Create the sample table, insert a small synthetic block range twice, and show that MergeTree retains both copies. Run the bounded duplicate-key query. Compare a literal block predicate with a bound introduced through a join and inspect `EXPLAIN indexes = 1` plus query-log scan counters.

## Checks

- Does the first sort-key prefix appear in the common predicates?
- Is partitioning justified by size or lifecycle operations rather than habit?
- Can the write strategy safely replay the same half-open range?
- Are monetary quantities kept as integers or precise decimals until presentation?

## Next Steps

Use the physical table as a dbt source and define an incremental model whose read window and write strategy form one recovery contract.

## Public References

- [ClickHouse: query condition cache](https://clickhouse.com/blog/introducing-the-clickhouse-query-condition-cache)
- [ClickHouse: MergeTree table engine](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree)
- [ClickHouse: EXPLAIN](https://clickhouse.com/docs/sql-reference/statements/explain)
