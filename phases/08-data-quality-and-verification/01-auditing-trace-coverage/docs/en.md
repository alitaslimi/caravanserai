---
title: "Auditing trace coverage"
phase: "Data Quality & Verification"
phaseNumber: 8
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["JSON-RPC"]
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

## Coverage note

Keep execution coverage and storage multiplicity as separate questions. A provider-era gap, an excluded trace type, and a warehouse duplicate can all change counts for different reasons. First classify missing keys by chain era and transaction outcome; then compare physical rows, logical keys, and conflicting payload versions independently.

## Lab

Build a fixture with a provider-era gap, a failed transaction, and one successful transaction with a missing trace. Produce one row per investigated range with the expected record type, the source evidence, and what remains unresolved. Preserve the original missing keys for follow-up.
