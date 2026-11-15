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
time: "45 minutes"
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

## Coverage contract

Declare the denominator before calculating a rate. For transaction tracing, the denominator is normally canonical transactions inside a finalized range, separated by transaction type and receipt status. The numerator is transactions for which the configured method returned a valid root result. Keep unsupported methods, permanent item errors, transient exhaustion, and intentionally excluded transaction classes in separate columns.

Aggregate coverage only after classifying keys. A high overall percentage can conceal a complete gap in an early chain era or one transaction type. Report coverage by chain, bounded block interval, source method, and capability revision. Include the block hashes at the audit boundary so a reorg does not look like provider disagreement.

## Failure drill

Remove traces for every transaction in one short era and remove one isolated successful transaction elsewhere. The era gap should trigger a capability or extraction investigation; the isolated key should trigger a record-level retry and cross-provider check. Add a duplicate trace frame and verify that it changes multiplicity without changing transaction coverage.

## Acceptance criteria

- Every missing key has a reason class or remains explicitly unresolved.
- Empty execution and unavailable trace data are never merged.
- Transaction coverage and frame uniqueness are reported separately.
- Samples include failed, successful, creation, and typed transactions where present.
- The report states the source cutoff, method, tracer configuration, and retrieval revision.
