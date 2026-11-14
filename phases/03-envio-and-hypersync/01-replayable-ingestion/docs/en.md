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
time: "15 minutes"
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
