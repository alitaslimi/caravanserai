---
title: "Diagnosing ClickHouse query performance"
phase: "Warehousing Onchain Data"
phaseNumber: 4
lessonNumber: 3
type: "Lab"
status: "draft"
tools: ["ClickHouse", "SQL"]
chains: ["EVM"]
protocols: []
datasets: ["logs", "query log"]
time: "80 minutes"
---

# Diagnosing ClickHouse query performance

## Why It Matters

Query optimization is not a collection of SQL tricks. In ClickHouse, performance begins with the physical relationship between predicates, the sorting key, parts, and selected columns. A query that reads fewer rows and bytes usually beats one that performs clever computation after a broad scan.

## Outcomes

- Read `EXPLAIN` output and query-log measurements as evidence.
- Distinguish partition pruning, primary-key pruning, and post-read filtering.
- Design `ORDER BY` for repeated access paths rather than uniqueness.
- Reduce scan width, join volume, and repeated decoding work.
- Run a reproducible before-and-after benchmark.

## Start with the question, not the engine setting

Write the target workload as a contract:

- Which chain and block or time interval is queried?
- Is filtering usually by emitter, event signature, transaction, or address?
- What is the result grain?
- How fresh must results be?
- Which repair range must be replaceable?

One table cannot optimize every access path. Raw logs may favor `chain_id, emitter_address, block_number, log_index`, while an address activity projection may favor `chain_id, participant_address, block_number`. Use a second projection or derived table only when a measured workload justifies its write and maintenance cost.

## Know the pruning layers

`PARTITION BY` is primarily a data-management boundary. It can prune whole partitions, but overly granular partitions create too many parts and expensive metadata operations. `ORDER BY` defines the sparse primary index and physical locality. Put low-to-moderate cardinality equality predicates and common range dimensions early enough to prune.

For every benchmark capture:

- query text or stable fingerprint;
- dataset revision and cold or warm cache condition;
- elapsed time, `read_rows`, `read_bytes`, and peak memory;
- result row count and checksum;
- plan evidence showing which keys were used.

Elapsed time alone is noisy. A faster run with the same large scan may only have benefited from cache.

## Diagnose in a fixed order

1. **Correctness**: verify grain, cutoff, and result checksum.
2. **Bounds**: add chain, block, and event filters as early as semantics allow.
3. **Projection**: select only needed columns; large `data` and trace payloads are costly.
4. **Pruning**: inspect whether the physical key matches the predicates.
5. **Cardinality**: aggregate or filter each join side before joining.
6. **Repeated work**: materialize stable decoded fields used by many queries.
7. **Settings**: tune memory and concurrency only after reducing unnecessary work.

This order avoids masking a data-model problem with more resources.

## Common onchain query traps

### Functions on filtered columns

Wrapping a key in a transformation can prevent effective pruning. Store normalized addresses at ingestion and compare the stored representation directly instead of calling a case function across every row.

### Joining wide raw tables first

If a metric needs daily transfer totals and daily prices, aggregate transfers to token-day before joining prices. Joining individual transfers to a large price history increases intermediate rows and memory.

### Using `FINAL` as a default

`FINAL` can force merge-time semantics at read time and may be expensive. Understand whether duplicates are transient storage versions or a violation of the logical write contract. Prefer explicit version selection or repaired partitions when the use case requires deterministic current rows.

### Treating materialized views as backfill jobs

An insert-triggered materialized view transforms new inserted blocks. Creating it does not necessarily populate historical source data. Build and validate a separate historical catch-up path, then establish the live cutover.

## Query cache is not a data model

ClickHouse can cache query conditions and results in supported configurations, which can help repeated workloads. Cache behavior should be measured separately and never used to justify a broad physical scan. Correct invalidation and freshness matter more than a warm demonstration query.

## Lab

Use `code/performance_lab.sql` against a synthetic log table. Run the unbounded topic query and record rows and bytes read. Then add chain, emitter, and block predicates aligned with the sorting key. Compare `EXPLAIN indexes = 1` and `system.query_log`.

Next, remove the unused `data` column from the projection and measure bytes read. Finally, aggregate token flows by day before joining a small price table. Keep the result checksum constant at every step.

## Acceptance criteria

- The optimized query returns the same logical result and cutoff.
- Measurements include rows, bytes, memory, elapsed time, and cache condition.
- Plan output demonstrates improved pruning rather than only lower latency.
- No engine setting compensates for an accidentally unbounded query.
- The proposed physical change names its write and repair trade-off.

## Public References

- [ClickHouse: MergeTree table engine](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree)
- [ClickHouse: EXPLAIN statement](https://clickhouse.com/docs/sql-reference/statements/explain)
- [ClickHouse: query condition cache](https://clickhouse.com/docs/operations/query-condition-cache)

