---
title: "Building a replayable onchain analytics system"
phase: "Capstone Systems"
phaseNumber: 11
lessonNumber: 1
type: "Capstone"
status: "draft"
tools: ["JSON-RPC", "Envio HyperSync", "ClickHouse", "dbt", "Airflow", "Python"]
chains: ["EVM"]
protocols: ["Synthetic value registry"]
datasets: ["blocks", "logs", "decoded events", "daily metrics"]
time: "6 to 10 hours"
---

# Building a replayable onchain analytics system

## Mission

Build a small system that extracts one synthetic event family through two source paths, conforms records into provider-neutral tables, decodes two ABI eras, publishes a daily metric, and repairs an injected duplicate or block replacement. The deliverable is not merely a working chart. It is an evidence package showing what was loaded, how correctness was checked, and how a bounded failure was repaired.

Use only public endpoints or supplied synthetic fixtures. Do not publish credentials, private hosts, organization-specific identifiers, or production measurements.

## System contract

The synthetic contract emits:

```solidity
event ValueChanged(address indexed actor, int256 delta, uint256 newValue);
```

Version two adds a category field and begins at a declared upgrade boundary:

```solidity
event ValueChanged(address indexed actor, bytes32 indexed category, int256 delta, uint256 newValue);
```

The published metric is daily net delta by category and chain. Preserve signed raw integers. Version-one events map to category `uncategorized` through an explicit semantic rule.

## Architecture and boundaries

```flow
{
  "caption": "Every boundary produces data and evidence for the next one.",
  "steps": [
    "Plan a finalized half-open block range",
    "Extract through RPC and an indexed source",
    "Persist raw evidence and range manifests",
    "Conform canonical blocks and logs",
    "Resolve ABI era and decode events",
    "Build incremental daily facts with dbt",
    "Reconcile and publish with coverage metadata"
  ]
}
```

Each stage must be independently rerunnable for a bounded range. Airflow coordinates stages but does not contain business logic that cannot run locally.

## Required artifacts

### 1. Source capability record

Record chain, source, methods, block interval, end semantics, selected fields, trace availability if relevant, retry limits, and retrieval date. Probe capabilities with a small request rather than inferring them from marketing labels.

### 2. Range manifest

Use `[from_block, to_block)` internally. A committed range includes block hashes at its boundaries, row count, checksum, destination revision, and durable completion time. An empty successful interval commits normally.

### 3. Canonical tables

Declare grains and logical keys for blocks and logs. Store chain ID, block number, block hash, transaction hash, transaction index, log index, emitter, topics, data, source, and fetch time. Retain competing block observations while exposing current canonical selection separately.

### 4. ABI registry and decoded facts

Resolve exactly one ABI era by chain, emitter, and historical position. Store ABI ID, decoder revision, raw-unit values, and failure status. Unknown and ambiguous decodes stay queryable.

### 5. Incremental dbt model

The incremental model declares:

- destination grain and unique key;
- per-chain watermark and overlap policy;
- handling for late or replaced source records;
- write strategy and partition repair behavior;
- tests for uniqueness, accepted values, and cutoff coverage.

Inspect compiled SQL. A configured strategy is not evidence that the adapter emitted the expected write.

### 6. Airflow DAG

Use a pinned artifact revision. Separate extraction, load, transform, quality, and publication tasks. Apply pools to shared source and database resources. Task retries cover transient failures; data-quality failures stop publication. A bounded backfill takes explicit start and end parameters and cannot overlap the live writer without a declared policy.

### 7. Metric response

Publish values with status, units, definition revision, source cutoff, generated time, and coverage. Return partial or unavailable when a required source is incomplete. Demonstrate that the headline equals grouped values plus any explicit remainder.

## Implementation sequence

### Stage A: Establish the fixture and cutoff

Choose a small public block range or generate deterministic fixture records. Freeze the accepted block hashes and create at least one quiet interval. Write the metric definition before coding.

### Stage B: Extract twice

Fetch the same logical event population through JSON-RPC and an indexed source such as HyperSync. Normalize address, hash, quantity, byte, and timestamp representations at the boundary. Never compare vendor payloads positionally.

### Stage C: Reconcile canonical keys

Produce these sets for each source: requested ranges, completed ranges, distinct log keys, duplicate keys, and block hashes. Report intersection, left-only, and right-only keys. Investigate a stratified sample from every difference class before claiming equivalence.

### Stage D: Decode across the era boundary

Use two registry entries with non-overlapping half-open intervals. Test the block before the boundary and the first block after it. If the transition occurs within a block, extend the historical position to transaction or log order.

### Stage E: Build and publish

Transform decoded events into daily net delta. Preserve the sum in raw units and expose the accepted source cutoff. Run dbt tests and an independent SQL reconciliation before publication.

### Stage F: Inject and repair failure

Choose one failure:

- submit one source range twice;
- replace the accepted block hash in a bounded interval;
- change one ABI registry boundary;
- remove a required source partition;
- fail the writer after fetch but before manifest commit.

Observe the incorrect or incomplete state, stop publication if required, find the first affected block, repair only the affected history, propagate the repair through decoded and aggregate tables, and re-run reconciliation. Keep before-and-after evidence.

## Acceptance tests

### Source and ingestion

- Every requested height is covered exactly once by committed half-open ranges.
- A committed manifest always refers to a durable destination revision.
- Replaying a committed range leaves logical output unchanged.
- Batch responses are matched by request ID, never array order.

### Warehouse and transformations

- Canonical logical keys are unique in the published view.
- Physical ordering supports the demonstrated query and repair paths.
- Incremental output matches a bounded full rebuild.
- A quiet stream and a newly added chain both advance correctly.

### Decoding and quality

- ABI resolution is unique at every decoded historical position.
- Decode failures and unknown signatures are counted by era.
- Cross-source differences are classified, not hidden by an aggregate count.
- The injected failure is detected by a named check.

### Orchestration and publication

- Retries cannot advance a checkpoint before durable success.
- Backfill and live-writer concurrency is explicitly bounded.
- Publication reports complete, partial, missing, or stale accurately.
- Metric values reconcile at the same cutoff and definition revision.

## Evidence package

Submit a concise runbook containing:

1. Architecture and responsibility boundaries.
2. Data contracts with grain, keys, units, and interval semantics.
3. Capability probe and range manifest examples.
4. Query plans and measured rows, bytes, memory, and cache condition.
5. dbt compiled SQL and test results.
6. Cross-source reconciliation tables.
7. Failure timeline, affected range, repair commands, and validation.
8. Metric response before failure, during partial state, and after repair.
9. Known limitations and the next check you would automate.

## Review rubric

| Area | Strong evidence |
| --- | --- |
| Correctness | Grain, keys, cutoffs, and invariants are explicit and tested |
| Replayability | Raw evidence and manifests reproduce a bounded result |
| Performance | Physical choices are supported by plans and scan measurements |
| Operations | Retries, pools, timeouts, and repairs have bounded behavior |
| Semantics | ABI eras, signed values, roles, and units retain provenance |
| Publication | Status and coverage prevent partial data from appearing complete |

## Stretch work

- Add trace-derived contract creation evidence and compare it with receipts.
- Add a second chain with the same emitter address to test namespace isolation.
- Benchmark RPC, indexed extraction, and warehouse query cost separately.
- Add a history-to-live cutover with a deliberate overlap and prove deduplication.
- Produce an automated quality report grouped by chain and ABI era.

