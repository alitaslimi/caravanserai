---
title: "Auditing trace coverage"
phase: "Data Quality & Verification"
phaseNumber: 8
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: []
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Auditing trace coverage

## Measure coverage by era

Start with ranges of transaction-bearing blocks and find blocks with no traces. Group the gaps by chain era and transaction type. Then inspect transactions and receipts inside each range before calling it a defect. A provider may omit a historical execution era or encode some classes of calls differently.

```flow
{
  "caption": "A coverage audit narrows a missing-range finding to individual execution records.",
  "steps": [
    "List transaction-bearing blocks",
    "Find blocks with no traces",
    "Separate chain eras",
    "Inspect receipts and transaction status",
    "Report expected gaps and unresolved records"
  ]
}
```

## Field note

An Arbitrum audit initially identified 67,513 cases for classification. The notes report that 46 remained outside the expected categories after reviewing the era and execution context. Another check compared raw and warehouse rows and found a count difference explained by deduplication. Keep these observations distinct. One addresses coverage and the other addresses storage multiplicity.

## Lab

Build a fixture with a provider-era gap, a failed transaction, and one successful transaction with a missing trace. Produce one row per investigated range with the expected record type, the source evidence, and what remains unresolved. Preserve the original missing keys for follow-up.
