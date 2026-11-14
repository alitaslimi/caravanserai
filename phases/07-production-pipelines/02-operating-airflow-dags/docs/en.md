---
title: "Operating Airflow DAGs for onchain data"
phase: "Production Pipelines"
phaseNumber: 7
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["Airflow", "dbt", "ClickHouse"]
chains: ["EVM"]
protocols: []
datasets: ["range plans", "task results", "data quality summaries"]
time: "60 minutes"
---

# Operating Airflow DAGs for onchain data

## Why It Matters

Onchain pipelines combine rate-limited APIs, mutable chain history, large warehouse writes, and transformations with their own concurrency rules. A DAG should make the data interval, side effects, retry safety, and publication boundary visible without requiring an operator to read every helper function.

## Outcomes

- Build a deterministic, side-effect-free DAG definition.
- Split tasks at meaningful retry and commit boundaries.
- Keep retries idempotent and bounded by timeouts.
- Limit warehouse and provider concurrency with pools.
- Preserve failure state while still running summaries and cleanup.
- Tie every run to immutable code and model revisions.

## Recommended shape

```flow
{
  "caption": "A replayable range pipeline.",
  "steps": [
    "Plan one half-open interval",
    "Fetch independent record groups",
    "Load idempotently",
    "Audit the common interval",
    "Publish or commit completion",
    "Clean successful temporary artifacts"
  ]
}
```

The plan is a small control-plane object: chain, `[from_block, to_block)`, source height, schema version, and run identifier. Fetch tasks may run in parallel, but they must consume the same plan. Large records belong in object storage or the warehouse, not XCom.

## Parse-time rules

At module import time:

- define static DAG structure and small registries;
- do not call RPCs, databases, Git, secret stores, or mutable filesystems;
- avoid expensive imports that only tasks need;
- use a fixed timezone-aware start date and explicit schedule;
- set `catchup=False` unless old logical intervals reproduce old input correctly.

A spot price or current order book is not historically backfillable merely because Airflow can create an old logical date.

## Task boundaries

Create a separate task when work has a distinct side effect, timeout, retry policy, resource pool, validation boundary, or useful partial rerun. Keep pure parsing and query-building helpers inside ordinary tested functions.

For every external or subprocess task, set:

- execution timeout;
- retry count and delay justified by idempotency;
- Airflow pool and slots for constrained resources;
- bounded internal retry or polling deadline;
- failure behavior that raises rather than logs and returns success.

## Failure and cleanup

An `ALL_DONE` summary or cleanup task can run after failure, but it must not become the only terminal green leaf. Keep a normal `ALL_SUCCESS` barrier or watcher so required upstream failure keeps the DAG failed. Preserve failed run artifacts when they make a targeted retry cheaper; clean them only after success unless retention is unnecessary.

## dbt execution

- Promote an immutable dbt commit or image with the Airflow release.
- Log Airflow revision, dbt revision, package revisions, and manifest hash.
- Use isolated workspaces for branches and on-demand runs.
- Lock exact model sets so conflicting writers serialize while disjoint work can run in parallel.
- Put all dbt queries in a shared warehouse pool; threads inside each dbt process are additional concurrency.
- Fail closed if the requested revision or manifest cannot be verified.
- Run cheap critical tests after hourly builds and a broader suite on a slower cadence.

Production and development targets must be separated by both naming and database permissions. A configuration bug should not allow a developer identity to overwrite scheduler-owned relations.

## Logging contract

Each meaningful task should log:

1. scope and reproducibility identifiers;
2. planned ranges, models, or files;
3. rate-limited progress;
4. validation results and explicit no-op reasons;
5. completion status, duration, affected counts, and output location.

Never log credentials, authorization headers, signed URLs, environment dumps, unbounded responses, or full private SQL.

## Lab

Read `code/onchain_range_dag.py`. Add a second fetch branch and verify both consume the same `plan_range` output. Make `audit_range` fail and confirm that `commit_range` cannot run. Add an `ALL_DONE` diagnostic task and a separate success barrier, then inspect the resulting graph.

## Checks

- Can clearing one task repeat a non-idempotent write?
- Does every task that can block have an execution timeout?
- Is total ClickHouse concurrency bounded across Airflow tasks and dbt threads?
- Can a summary or cleanup task hide an upstream failure?
- Does the run record the exact code and model revisions used?

## Next Steps

Add a quality ladder that distinguishes orchestration success, data freshness, key completeness, and value correctness.
