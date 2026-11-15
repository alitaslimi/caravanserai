---
title: "Observing pipeline cost and throughput"
phase: "Data Quality & Verification"
phaseNumber: 8
lessonNumber: 3
type: "Lab"
status: "draft"
tools: ["Airflow", "ClickHouse", "OpenTelemetry"]
chains: ["EVM"]
protocols: []
datasets: ["range manifests", "query log", "task metrics"]
time: "70 minutes"
---

# Observing pipeline cost and throughput

## Why it matters

Pipeline health cannot be inferred from task success alone. A run can succeed while falling behind, scanning too much, retrying expensive calls, or publishing incomplete data. Onchain systems need metrics tied to a completed, verified block range so latency, resource use, and provider consumption share one denominator.

## Outcomes

- Separate event freshness, processing lag, and publication lag.
- Measure extraction, decoding, writing, and query work independently.
- Calculate cost and throughput per committed block range.
- Design bounded-cardinality telemetry labels.
- Connect alerts to user-visible data contracts.

## The range is the operating unit

Emit one summary after a range becomes durable:

- chain and dataset class;
- start, end, blocks, rows, and encoded bytes;
- source requests, retries by class, and throttled time;
- extraction, queue, decode, insert, and quality duration;
- ClickHouse rows read, bytes read, written rows, and peak memory;
- final status, coverage, pipeline revision, and cutoff hash.

Do not place transaction hashes, addresses, run IDs, or raw error messages in metric labels. They create unbounded cardinality. Keep detailed identities in logs or manifests and use controlled labels such as chain, stage, source family, status, and error class.

## Lag has several clocks

- **Source lag**: accepted chain head minus the last committed source block.
- **Transformation lag**: committed source cutoff minus transformed cutoff.
- **Publication lag**: transformed cutoff minus published cutoff.
- **Wall-clock freshness**: current time minus the published block timestamp.

Alerting on only the last task time can miss a pipeline that runs frequently but stops advancing.

## Cost without false precision

Provider requests, compute time, warehouse scans, storage, and egress use different billing models. Keep usage measures separate from billed currency until a versioned rate card is applied. Useful normalized measures include requests per completed block, bytes read per output row, writer seconds per million rows, and retries per committed range.

A failed attempt still consumes resources. Attribute attempt usage to the eventual range outcome so repeated failures are visible. Do not divide by zero-row results without defining the alternative denominator; a quiet range can still cost requests and blocks scanned.

## Service objectives

Define objectives from publication contracts, such as “complete source coverage through the accepted cutoff” and “published cutoff no more than a declared duration behind accepted head.” Use multi-window alerts: a fast burn detects severe failures while a slower window detects persistent degradation.

Every alert should point to a runbook decision: source throttling, queue saturation, decode regression, ClickHouse scan growth, quality failure, or publication blockage.

## Lab

Use `code/range_metrics.sql` to summarize synthetic manifests and query-log measurements. Compare two pipeline revisions with the same chain and range class. Identify whether a throughput regression comes from extraction, insertion, or a broader dbt scan.

Create three alert fixtures: tasks succeed but cutoff does not advance, requests spike because of retries, and publication stays blocked by missing price coverage. Each alert should name the affected contract state rather than merely say “DAG failed.”

## Acceptance criteria

- Every metric has a stable unit and bounded label set.
- Cutoff advancement is measured separately from task execution.
- Failed-attempt usage remains attributable.
- Usage and billed cost are not conflated.
- Alerts link technical symptoms to incomplete, partial, stale, or unavailable publication.

