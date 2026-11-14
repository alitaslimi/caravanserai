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

## Field note

The HyperSync pipeline separated streaming, mapping, and the ClickHouse loader. The wire format could expose binary values where downstream code expected hexadecimal strings. Block timestamps required enrichment for records whose feed supplied only a block number. The session also compared declared fields with actual responses across networks and eras. A schema matrix should record both the declared type and whether representative responses populate it.

## Lab

Use half-open ranges [100, 120) and [120, 140). Interrupt the job after the first write and before its checkpoint. Replay [100, 120) and show that a deterministic write key or replacement operation leaves one logical row per key. Record the completed range and then continue.
