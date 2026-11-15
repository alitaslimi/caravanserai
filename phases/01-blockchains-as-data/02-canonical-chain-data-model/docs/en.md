---
title: "Designing a canonical chain data model"
phase: "Blockchains as Data"
phaseNumber: 1
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["SQL"]
chains: ["EVM"]
protocols: []
datasets: ["blocks", "transactions", "receipts", "logs", "traces"]
time: "75 minutes"
---

# Designing a canonical chain data model

## Why It Matters

An EVM chain is not one table. It is a set of related records produced at different stages: consensus orders blocks, transactions request execution, receipts summarize outcomes, logs expose application events, and traces describe internal calls. Flattening those records too early hides missing coverage and creates accidental many-to-many joins.

The goal is a canonical layer: provider-neutral tables that preserve chain identity, execution order, raw values, and source provenance. Protocol models can then depend on stable keys without depending on an RPC vendor's response shape.

## Outcomes

- State the grain and natural key of each raw chain table.
- Join blocks, transactions, receipts, logs, and traces without multiplying rows.
- Represent canonicality and reorg replacement explicitly.
- Distinguish a missing record from an unsupported field.
- Design a conformance boundary that retains raw evidence.

## One execution, several grains

| Dataset | One row represents | Candidate natural key |
| --- | --- | --- |
| Blocks | A block observed on a chain | `chain_id, block_hash` |
| Transactions | A transaction included in a block | `chain_id, transaction_hash` |
| Receipts | The execution result of one transaction | `chain_id, transaction_hash` |
| Logs | One emitted log in a receipt | `chain_id, block_hash, log_index` |
| Traces | One call frame in a transaction | `chain_id, transaction_hash, trace_address` |

Block number alone is not immutable identity. During a reorganization, two block hashes can be observed at the same height. Keep both the height used for range scans and the hash used for identity. A current-canonical view can select the accepted hash, while an observation table retains replaced blocks for audit and replay.

`trace_address` is the path of child indexes from the transaction root, such as `[]`, `[0]`, or `[0, 2]`. A provider may expose a different trace identifier, so preserve the source identifier and derive a normalized path only when the mapping is understood.

## Ordering is part of the data

Event time is not sufficient to reproduce execution order because every transaction in a block shares the block timestamp. Use the ordered tuple appropriate to the grain:

- Transactions: `block_number, transaction_index`
- Logs: `block_number, transaction_index, log_index`
- Traces: `block_number, transaction_index, trace_address`

Do not invent ordering from ingestion time. `_fetched_at` explains when a pipeline observed a record, not when the chain executed it.

## Three kinds of absence

Nulls should not collapse unrelated conditions:

1. **Not applicable**: a contract creation has no call destination.
2. **Supported but absent**: a receipt has no contract address because the transaction did not create a contract.
3. **Not collected or unsupported**: trace data was not requested or the source could not provide it.

Add coverage metadata at the batch or partition level, such as `traces_requested`, `trace_method`, and `source_capability_version`. A nullable `trace_count` cannot explain why traces are absent.

## Join contracts

Start from the grain you intend to publish. If the output is one row per log, join the containing transaction and block through many-to-one relationships. Aggregate traces to transaction grain before joining them to logs unless the desired output genuinely includes one row per log and trace pair.

```sql
select
    l.chain_id,
    l.block_number,
    l.block_hash,
    l.transaction_hash,
    l.log_index,
    t.transaction_index,
    b.block_timestamp
from canonical_logs l
inner join canonical_transactions t
    on l.chain_id = t.chain_id
   and l.transaction_hash = t.transaction_hash
   and l.block_hash = t.block_hash
inner join canonical_blocks b
    on l.chain_id = b.chain_id
   and l.block_hash = b.block_hash
```

The hash predicates prevent a log observed on an replaced fork from inheriting metadata from the current block at the same height.

## Raw, conformed, and semantic boundaries

Use three responsibilities rather than one wide table:

- **Raw capture** keeps source payloads or a lossless subset with retrieval metadata.
- **Canonical conformance** normalizes quantities, byte fields, keys, and timestamps.
- **Semantic models** decode contracts and assign domain meaning.

Canonical tables should not rename `from_address` to `depositor` or `borrower`; that interpretation belongs to the decoded event or protocol model. Preserve integer raw units beside scaled decimal values so a future decimal correction does not require refetching the chain.

## Lab

Use `code/canonical_schema.sql` to create a small set of canonical tables. Insert two competing block hashes at the same height, attach one transaction and log to each, and build a current-canonical view from an explicit block selection table.

Then write three assertions:

1. A log-to-transaction join returns exactly one row per input log.
2. Selecting the replacement block changes the current view without deleting observations.
3. A trace coverage record distinguishes “zero traces returned” from “traces not collected.”

## Checks

- Can every row be tied to a chain and immutable block identity?
- Are logical keys documented separately from warehouse engine behavior?
- Can you explain every nullable field as absent, not applicable, or unavailable?
- Does a protocol-specific name appear only after decoding?
- Can a reorg correction be applied without rewriting unrelated heights?

## Next Steps

Use this canonical contract as the target of both JSON-RPC and indexed extraction. Reconcile the two paths by keys and coverage before comparing decoded metrics.

