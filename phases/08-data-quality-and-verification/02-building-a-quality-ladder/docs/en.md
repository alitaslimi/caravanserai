---
title: "Building a data quality ladder"
phase: "Data Quality & Verification"
phaseNumber: 8
lessonNumber: 2
type: "Concept"
status: "draft"
tools: ["dbt", "ClickHouse", "Airflow"]
chains: ["EVM"]
protocols: []
datasets: ["blocks", "logs", "decoded events", "facts"]
time: "35 minutes"
---

# Building a data quality ladder

## Why It Matters

A green task proves that code returned successfully. A recent timestamp proves that something wrote recently. Neither proves that an onchain table is complete, unique, or economically correct. Use a ladder of increasingly expensive checks and schedule each at the cadence where it is useful.

## Outcomes

- Separate orchestration, freshness, structural, reconciliation, and value checks.
- Run cheap critical checks after each incremental build.
- Reserve exact historical scans for bounded or slower audits.
- Alert on new and growing failures without hiding known debt.
- Preserve evidence and uncertainty in audit reports.

## The ladder

| Level | Question | Example |
| --- | --- | --- |
| Execution | Did required work fail visibly? | Exit code, task state, retry count |
| Freshness | Did expected data arrive? | `max(block_timestamp)` against source cadence |
| Structure | Is the declared grain intact? | Null keys, duplicate natural keys, schema contract |
| Coverage | Are expected source keys represented? | Blocks, logs, or emitters missing in the run interval |
| Reconciliation | Do independent derivations agree? | Transfer replay versus contract state |
| Value | Are units and economics plausible? | Conservation, bounded rates, sign conventions |

Checks at one level do not replace another. A perfectly unique table can be incomplete; two incomplete tables can reconcile because they share the same source.

## Cadence

**Every incremental run**

- task and subprocess status;
- bounded freshness;
- null and duplicate keys in the written interval;
- planned versus written row counts;
- explicit no-data classification.

**Daily**

- complete dbt data-test suite;
- source-to-model coverage by domain;
- stale feeds and orphaned outputs;
- trend in known failures and test runtime.

**Weekly or after repairs**

- bounded historical parity;
- payload comparisons after aligned typing;
- whole-partition or stratified reconciliation;
- consumer and lineage audit;
- representative query cost and active-part health.

## Baselines without alert fatigue

A known-failure baseline should never turn a failed test into a pass. Record:

- test identity and declared grain;
- current affected key count;
- first and latest observation;
- owner and repair plan;
- whether the count is stable, shrinking, or growing.

Alert immediately on new failures and growth. Continue reporting stable known failures in the run summary so the baseline cannot become invisible permanent debt.

## Audit sequence

Start cheap and narrow:

1. Use metadata to identify size, parts, and freshness.
2. Bucket counts by time or block range.
3. Compare natural key sets at the same cutoff.
4. Separate exact duplicate rows from conflicting payloads.
5. Recompute bounded model output when necessary.
6. Use query, part, and orchestration logs to attribute the mechanism.
7. Record rejected hypotheses as well as the conclusion.

Read-only audits should be enforced through database permissions. Compilation or adapter connection checks can still create probe objects, so understand tool side effects before calling an audit read-only.

## Lab

Create a synthetic table with one missing key, one exact duplicate, and two rows sharing a key but disagreeing on value. Produce separate counts for each class. Add a stale-but-successful source task and show why DAG success does not satisfy the freshness check.

## Checks

- Are source and target compared at the same finality cutoff?
- Is the chosen key truly the table's analytical grain?
- Could both sides share the same missing upstream source?
- Are expensive checks bounded to a recent range or partition?
- Does the alert distinguish new, growing, and stable failures?

## Next Steps

Publish quality and freshness beside the metric so downstream users can distinguish zero, missing, stale, and unverified data.
