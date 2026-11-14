---
title: "Contracting an indexed extraction source"
phase: "Bulk Extraction and Ingestion"
phaseNumber: 3
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["Envio", "HyperSync", "JSON-RPC", "ClickHouse"]
chains: ["EVM"]
protocols: []
datasets: ["blocks", "transactions", "logs", "traces", "ingested ranges"]
time: "45 minutes"
---

# Contracting an indexed extraction source

## Why It Matters

Indexed services such as Envio HyperSync can retrieve large ranges more efficiently than per-block JSON-RPC, but their schemas, encoding, range semantics, and coverage still need an explicit contract. Faster extraction does not remove the need for replay safety or independent verification.

## Outcomes

- Define a source-to-target field contract before loading data.
- Normalize Arrow bytes, hex strings, quantities, and timestamps at one boundary.
- Make every batch replayable with a half-open range and natural key.
- Checkpoint only after the destination and audit are durable.
- Compare indexed output with RPC using matched keys and cutoffs.

## Field contract

For every selected source field, record:

| Contract column | Example |
| --- | --- |
| Record type | `logs` |
| Source field | `address` |
| Declared wire type | binary or hex string |
| Observed variants | bytes, `0x`-prefixed string, null |
| Target field | `contract_address` |
| Target type | fixed-length hex string or binary |
| Natural key | `(chain_id, block_number, transaction_index, log_index)` |
| Validation | byte length, prefix, null rule |

Do not let each downstream model reinterpret the provider payload. Normalize once, retain provenance, and reject malformed values before writing.

## Range ledger

Use half-open ranges `[from_block, to_block)`. A checkpoint row should include at least:

- source and chain identity;
- range bounds;
- selected schema version;
- batch or object key;
- expected and written row counts by record type;
- audit status;
- extraction and completion timestamps.

The checkpoint is a commit marker. Write it after data insertion and bounded audits succeed. If a worker dies after the data write but before the checkpoint, replay must converge to the same logical keys.

## Envio and HyperSync guidance

- Select only required fields; wide trace and log payloads dominate transfer and decode costs.
- Inspect actual client return types rather than assuming RPC-style hex strings.
- Fetch block timestamps separately when child records do not carry them.
- Give logs, transactions, blocks, and traces their own keys and coverage checks.
- Cap concurrency according to service limits and destination insert capacity.
- Record the remote height used to plan the range and leave a finality or provider-lag margin.
- Treat an empty response as valid only after proving the requested range completed successfully.

The official clients use language-specific field naming and expose Arrow or Parquet in Python and Rust. Confirm the client version and query schema used by the example; do not copy field names between Node, Python, and Rust without checking the client contract. HyperSync ranges use an exclusive upper bound.

## Cross-source verification

JSON-RPC is not automatically the truth and an indexed source is not automatically complete. For a bounded sample:

1. Match chain, block interval, finality cutoff, and inclusion rules.
2. Compare natural keys.
3. Decode or normalize aligned fields to the same types.
4. Classify missing, extra, exact duplicate, and conflicting records separately.
5. Preserve raw evidence for unresolved differences.

## Lab

Use the synthetic records in `code/normalize.py`. Normalize one binary address and one hex address to the same representation. Then simulate a crash after loading `[100, 120)` but before checkpointing it. Replay the range and demonstrate that key-based replacement or anti-join insertion leaves one logical row per log key.

## Checks

- Does the source range include `to_block` or stop before it?
- What makes a retry idempotent if only some tables committed?
- Can a checkpoint exist while its data is incomplete?
- How is an old historical replay made visible to downstream incrementals?

## Next Steps

Load the normalized fixture into a ClickHouse table whose physical design supports both analyst queries and bounded repair.

## Public References

- [Envio: HyperSync client libraries](https://docs.envio.dev/docs/HyperSync/hypersync-clients)
- [Envio: HyperSync overview](https://docs.envio.dev/docs/HyperSync/overview)
- [Envio: decoding transaction traces](https://docs.envio.dev/docs/HyperSync/tutorial-decoding-traces)
- [Envio: indexing and reorgs](https://docs.envio.dev/blog/indexing-and-reorgs)
