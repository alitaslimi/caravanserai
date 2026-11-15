---
title: "Planning ranges and controlling backpressure"
phase: "Bulk Extraction and Ingestion"
phaseNumber: 3
lessonNumber: 3
type: "Build"
status: "draft"
tools: ["Envio HyperSync", "Python", "JSON-RPC"]
chains: ["EVM"]
protocols: []
datasets: ["logs", "range manifests"]
time: "70 minutes"
---

# Planning ranges and controlling backpressure

## Why It Matters

Large onchain ranges are uneven. A quiet span may return a few records, while a popular contract or volatile period can exceed response, memory, or insert limits. Fixed block chunks are easy to implement but weak at controlling actual work. A robust extractor treats range planning, memory pressure, and durable progress as separate concerns.

## Outcomes

- Use half-open ranges consistently across source and destination.
- Adapt range size from observed bytes, rows, and latency.
- Bound in-flight work with backpressure.
- Commit progress only after a durable, verified write.
- Compare JSON-RPC and indexed extraction at a neutral boundary.

## Make interval semantics explicit

Represent work as `[from_block, to_block)`: the first height is included and the second is excluded. Half-open ranges compose without overlap:

`[100, 200) + [200, 300) = [100, 300)`

Provider APIs differ. If a source uses an inclusive end, adapt only at the source boundary. Keep the internal manifest half-open and assert that an empty range has `from_block == to_block`.

## Separate the control plane from payloads

A range manifest is the control plane. It should record:

- chain ID, dataset, filters, and selected fields;
- half-open start and end heights;
- source and capability version;
- attempt, status, and timestamps;
- returned row count, encoded bytes, and checksum;
- destination table and committed revision;
- error classification without credentials.

Payload rows belong in raw or canonical tables, not inside the scheduler state. This separation makes it possible to retry orchestration without duplicating data.

## Adapt from evidence

Start with a conservative block span. After each successful request, adjust toward a target payload size or latency window. Shrink aggressively on source limits, timeouts, or memory pressure; grow gradually after several stable ranges. Always enforce minimum and maximum spans.

Block count remains useful for addressing work, but row count and bytes better represent cost. Record all three. A range containing no matching logs is still a successful range and must advance the checkpoint.

## Backpressure and bounded concurrency

Streaming does not automatically mean bounded memory. If extraction produces batches faster than ClickHouse accepts them, a queue grows until the worker fails. Use a bounded queue or a small pool of range workers. A producer should pause when the queue is full.

Keep three limits distinct:

1. Source request concurrency protects the provider contract.
2. Decode concurrency protects CPU and process memory.
3. Insert concurrency protects the destination and avoids competing writers.

A single global worker count hides which resource is saturated. Export queue depth, active requests, insert latency, retry class, and bytes in flight.

## Commit protocol

For each range:

1. Mark an attempt as running.
2. Fetch and normalize a bounded batch.
3. Write to a range-scoped staging target or with an idempotency key.
4. Validate expected schema, range bounds, and logical-key uniqueness.
5. Promote or acknowledge the durable write.
6. Mark the manifest committed and advance the contiguous checkpoint.

Never advance on “request completed” alone. A process can fail between response receipt and durable insertion.

## Cross-source reconciliation

When comparing HyperSync with JSON-RPC, normalize keys first. Compare coverage in layers:

- requested and completed block intervals;
- distinct natural keys;
- values for shared keys;
- source-only keys with classified reasons;
- block hashes at the extraction cutoff.

Do not demand identical raw response shapes. An indexed service can offer selected typed columns while RPC returns nested hex JSON. The useful question is whether both paths agree on the canonical records they claim to cover.

## Lab

Run `code/range_planner.py` and inspect how the next span changes after small, target-sized, and oversized payloads. Add a simulated empty result and verify that the range still commits. Then design a manifest for one event signature over a synthetic block interval.

For an advanced exercise, place a bounded queue between a fake producer and consumer. Make the consumer slow and confirm that total queued batches never exceeds the configured capacity.

## Checks

- Are interval end semantics converted exactly once?
- Can an empty but successful range advance progress?
- Is progress contiguous, or can a later completion hide a gap?
- Are provider throttling and destination saturation measured separately?
- Can the same committed range be submitted again without changing the result?

## Next Steps

Load these canonical batches into ClickHouse with physical keys chosen from the dominant scan and repair paths.

