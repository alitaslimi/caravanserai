---
title: "Reading a transaction"
phase: "Blockchains as Data"
phaseNumber: 1
lessonNumber: 1
type: "Concept"
status: "draft"
tools: []
chains: []
protocols: []
datasets: []
time: "20 minutes"
---

# Reading a transaction

## Records and their grain

```flow
{
  "caption": "A receipt and a trace describe execution from different perspectives.",
  "steps": [
    "Find the canonical block",
    "Identify the included transaction",
    "Read the receipt and emitted logs",
    "Inspect internal calls where traces are available"
  ]
}
```

Start with an EVM transaction in a finalized block. Collect the block, the transaction, its receipt, and any available traces. Record the provider and block hash alongside the results.

| Record | What one row represents | Example identity within a chain |
| --- | --- | --- |
| Block | A particular block | Block hash |
| Transaction | A transaction included in a block | Transaction hash in canonical history |
| Receipt | The execution result for a transaction | Transaction hash in canonical history |
| Log | An event emitted during execution | Block hash and block-level log index |
| Trace | An execution step or call in the provider's trace format | Transaction hash and trace path for transaction-scoped calls |

If you retain competing forks, include block identity in transaction-scoped keys. Inspect the trace format before choosing a key. Some providers expose records that have no parent transaction, so a transaction hash and trace path only describe the transaction-scoped subset.

## Verify coverage before interpreting gaps

A field can be declared in the schema and still be empty for an entire era. In an Arbitrum audit, grouping by transaction type and chain era made it possible to distinguish expected missing fields from suspicious gaps. For traces, start by comparing blocks that contain transactions with blocks represented in the trace feed. Then inspect individual transactions and receipts inside the missing ranges.

## Lab

Choose one transaction that emitted a log. Save the raw responses and write one line describing what each record establishes. Compare the event's position using the receipt and your warehouse row. Record the block hash so someone else can check the same execution. For a missing trace, report the evidence you have and the provider capability you would need to settle the question.
