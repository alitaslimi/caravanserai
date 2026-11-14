---
title: "Writing an incremental model contract"
phase: "Transformation and Incremental Modeling"
phaseNumber: 5
lessonNumber: 3
type: "Build"
status: "draft"
tools: ["dbt", "ClickHouse"]
chains: ["EVM"]
protocols: []
datasets: ["events", "ingested ranges", "model tests"]
time: "50 minutes"
---

# Writing an incremental model contract

## Why It Matters

`materialized='incremental'` describes how dbt invokes a model; it does not define what late data, retries, corrections, or historical replays mean. The model needs an explicit contract joining its natural key, read window, write strategy, and repair path.

## Outcomes

- Declare the model grain and independently advancing dimensions.
- Select an incremental window appropriate to the source's arrival behavior.
- Pair repeated reads with an idempotent write strategy.
- Provide a bounded replay path for data older than the normal lookback.
- Test uniqueness, freshness, and source-to-target coverage.

## Contract template

Document these fields beside the model:

| Property | Question |
| --- | --- |
| Grain | What does exactly one row represent? |
| Natural key | Which fields uniquely identify that row? |
| Progress dimensions | Can chains, markets, emitters, or tokens advance independently? |
| Normal read window | How are late live records recovered? |
| Historical replay signal | How does an old source rewrite become visible? |
| Write strategy | Can the same window be applied twice? |
| Correction rule | Can an existing key's payload change? |
| Repair interface | Which start/end variables or partitions rebuild history? |
| Tests | Which checks prove completeness and uniqueness? |

## Two clocks

Onchain pipelines often have two independent coordinates:

- **Event position:** block number, transaction position, or timestamp.
- **Arrival position:** ingestion time, object generation, or completed-range ledger.

A model that advances only by maximum block number will not see a historical block inserted today. A recent block lookback repairs ordinary ingestion lag but not a replay months behind the watermark. Use an ingestion-range ledger or an explicit repair command to surface those writes.

## Per-stream progress

A chain-wide maximum can skip a newly added market or emitter. Maintain progress at the dimension that can begin or stall independently, such as `(chain_id, emitter)` or `(chain_id, market_id)`. For a new stream, begin at its deployment or registration block; for an existing stream, use its own progress minus a documented overlap.

## Write strategies

| Strategy | Good fit | Main hazard |
| --- | --- | --- |
| Append | Immutable, disjoint ranges | Retry creates duplicates |
| Keyed delete and insert | Bounded corrections | Delete visibility and mutation cost |
| Partition replacement | Complete partition recomputation | Omitting untouched rows deletes them |
| Replacing engine | Eventually replaces versions | Queries may need `FINAL`; merges are asynchronous |
| Anti-join insert | Immutable keys with repeated read window | Cannot correct an existing payload |

Inspect the adapter's generated SQL for the installed version. A strategy name is not a portable guarantee across adapters and engines.

## Environment isolation

A target named `dev` is not isolated if schema generation still resolves to production relations. Production should have one scheduler identity and explicit target. Developer and CI runs should resolve to personal or pull-request schemas, with database permissions preventing writes to production even if configuration is wrong.

## Lab

Use the model skeleton in `code/stg_value_changed.sql`. Load two emitters, advance one, then introduce a new emitter with older events. Show why a chain-wide maximum skips it. Add a bounded `repair_start_block`/`repair_end_block` run and verify that running the repair twice preserves one row per natural key.

## Checks

- Does every denominator and monetary conversion preserve exact types?
- Does a new stream start from its own history rather than another stream's head?
- What happens after an outage longer than the normal lookback?
- Does a model SQL change require a historical rebuild?
- Can developers write the scheduler's target relations?

## Next Steps

Place model execution inside an orchestrator that serializes conflicting writers, records the exact code revision, and runs cheap critical tests after each build.
