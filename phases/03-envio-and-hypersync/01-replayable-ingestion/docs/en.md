---
title: "A replayable ingestion pipeline"
phase: "Bulk Extraction and Ingestion"
phaseNumber: 3
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["HyperSync","ClickHouse"]
chains: []
protocols: []
datasets: []
time: "50 minutes"
---

# A replayable ingestion pipeline

## Split extraction, mapping, and loading

A provider client selects a chain, block range, and fields. A mapping stage normalizes types and enriches records. The loader writes a batch and records the covered range only after the write is durable. Store source, range, schema version, and a batch identifier with that checkpoint.

```flow
{
  "caption": "A checkpoint advances after the load is durable.",
  "steps": [
    "Request fields for a bounded range",
    "Inspect returned types",
    "Normalize and attach block time",
    "Write and verify the batch",
    "Record the completed range"
  ]
}
```

## Provider note

HyperSync clients may expose binary values where an RPC-oriented pipeline expects hexadecimal strings. Some record types may also require block timestamp enrichment. Keep streaming, normalization, and loading as separate stages, and maintain a source-to-target field matrix containing the declared type, observed type, nullability, normalization rule, and representative coverage across chains and historical eras.

## Lab

Use half-open ranges [100, 120) and [120, 140). Interrupt the job after the first write and before its checkpoint. Replay [100, 120) and show that a deterministic write key or replacement operation leaves one logical row per key. Record the completed range and then continue.

## Commit protocol

Treat source response, destination write, and checkpoint commit as three states. A worker can fail between any two. Write a range-scoped attempt identifier with the batch, verify the natural-key count and bounds in the destination, then mark the range committed. On restart, inspect destination evidence for incomplete attempts before requesting the source again.

Progress advances only through the highest contiguous committed end. If `[120, 140)` finishes before `[100, 120)`, it may be durable but cannot move the public checkpoint past the gap. Empty successful ranges participate in the same rule.

## Failure drill

Exercise four stops: before the request, after the response, after half the destination write, and after the full write but before commit. For each stop, document whether retry should refetch, replace staging, resume loading, or only reconstruct the manifest. Ensure credentials and full provider URLs never enter the saved fixture.

## Acceptance criteria

- Internal interval semantics remain half-open across every stage.
- Retrying any attempt leaves one logical row per declared key.
- A later completed range cannot hide an earlier gap.
- Source schema changes fail before checkpoint advancement.
- The manifest connects source, schema, destination revision, row count, and checksum.
