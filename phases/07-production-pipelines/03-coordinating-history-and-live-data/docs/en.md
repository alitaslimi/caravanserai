---
title: "Coordinating history and live data in Airflow"
phase: "Production Pipelines"
phaseNumber: 7
lessonNumber: 3
type: "Build"
status: "draft"
tools: ["Airflow", "dbt", "ClickHouse"]
chains: ["EVM"]
protocols: []
datasets: ["range manifests", "Airflow datasets"]
time: "90 minutes"
---

# Coordinating history and live data in Airflow

## Why it matters

Historical backfills and a live tail write the same logical datasets under different workloads. Without an explicit cutover, they can overlap, leave a gap, or race on partition replacement. Airflow should coordinate bounded work and evidence, not hide range logic inside opaque tasks.

## Outcomes

- Plan dynamic tasks from half-open range manifests.
- Separate source, decoder, and writer concurrency with pools.
- Define a history-to-live cutover that proves no gaps or overlaps.
- Use dataset-aware scheduling for downstream transformations.
- Choose sensors and deferrable waits without occupying workers.
- Pin and verify the artifact revision executed by every task.

## Cutover protocol

Choose an immutable boundary block hash accepted by the finality policy. History owns `[deployment_block, cutover_block)`. The live path owns `[cutover_block, published_head)`. Persist both ownership records before enabling the live writer.

The cutover check proves:

1. Every historical range below the boundary is committed contiguously.
2. The boundary hash still matches the canonical chain.
3. The first live range begins exactly at the boundary.
4. Logical keys remain unique after both paths write.

If an overlap is intentional, declare which writer owns replacement and prove idempotency. Do not rely on task timing.

## Dynamic mapping and pools

The planner produces small serializable range descriptors. A mapped extraction task handles one descriptor. Pools separately bound provider requests, CPU-heavy decoding, and ClickHouse writes. `max_active_runs` prevents two scheduled DAG runs from creating competing live writers, while a dedicated writer pool coordinates backfills.

Mapping thousands of tiny ranges creates scheduler overhead. Keep range size adaptive and cap mapped task count. A manifest table remains the source of durable progress; Airflow task success alone is not a checkpoint.

## Dataset-aware downstream scheduling

Emit a dataset event only after committed source ranges and their quality gate succeed. Downstream dbt models can subscribe to the canonical dataset rather than guess source completion from a clock. Include cutoff and revision in event metadata where supported, and read the manifest inside the consumer rather than trusting notification delivery as data evidence.

## Waiting without holding a worker

Use deferrable sensors for external finality, object arrival, or long-running query completion when a supported trigger exists. The task should release its worker slot while waiting and resume on the event. Always set a timeout and define whether timeout is retryable, partial, or fatal.

## Revision and parameter safety

Pass an expected immutable revision into the DAG run and verify it before writing. Reject a missing or mismatched revision. Validate chain, start, end, destination, and repair reason as typed parameters. Never construct SQL identifiers directly from an untrusted DAG parameter.

## Lab

Extend `code/history_live_dag.py` with three historical ranges and one live range. Confirm that a gap prevents dataset publication. Then create an intentional overlap and require the writer to use the same idempotency key.

Simulate a provider wait with a deferrable sensor or a short educational substitute. Verify that its timeout stops the publication task. Finally, launch two backfills and confirm the writer pool serializes their destination mutations.

## Acceptance criteria

- Range ownership is explicit and contiguous at cutover.
- Dynamic tasks are bounded and retry one range independently.
- Pool names correspond to actual shared resources.
- Dataset events follow durable writes and quality checks.
- Every write records the verified code revision and DAG run identity.

