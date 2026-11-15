---
title: "Measuring DEX TVL"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 1
type: "Concept"
status: "draft"
tools: []
chains: []
protocols: ["Uniswap"]
datasets: []
time: "20 minutes"
---

# Measuring DEX TVL

## Choose the quantity and cutoff

```flow
{
  "caption": "Keep ambiguous singleton transfers in a separate remainder and reconcile before pricing.",
  "steps": [
    "Identify the custody holder",
    "Measure balances at the cutoff",
    "Attribute only supported pool amounts",
    "Reconcile to total custody",
    "Apply prices at the same cutoff"
  ]
}
```

For custody TVL, measure token holdings at a declared cutoff and multiply each holding by its price at that cutoff. Summing transfers valued when they happened gives historical flows. It can diverge from current holdings even when the transfer data is complete.

Identify the holder before querying balances. A factory can emit a pool-creation event without holding the pool's tokens. A singleton contract can hold assets for many pools. An address-level balance from that singleton establishes total custody and leaves per-pool attribution to other evidence.

## Use the protocol's accounting rules

In a Uniswap V3-style pool, a burn can credit tokens owed, while a collect can pay out principal and fees. A replay that treats both events as withdrawals can double-count the outflow. Transfer replay also misses balance changes from rebases. Check the result against a historical state read at the same block where you can.

For singleton custody, separate amounts you can attribute from the remainder. A case from the sessions attributed transfers when a transaction touched exactly one relevant pool. Transactions with multiple candidate pools stayed unattributed. That approach gives an auditable subtotal under an explicit attribution rule.

## Lab

At a fixed block, compare the token balances of a pool contract and a singleton custody contract. For each one, record the holder, the pool identifier, the attribution rule, and any amount you cannot assign. Reconcile the attributed and unattributed amounts to the custody total before applying prices.

Use `code/tvl_reconciliation.sql` with synthetic balances. The lab passes when attributed and unattributed balances reconcile to custody in raw units, every price is at or before the cutoff, and missing prices remain visible rather than becoming zero.

## Failure cases to test

- A pool-creation event points to a factory that never holds the assets.
- One transaction touches several pools and cannot support deterministic attribution.
- A rebasing token changes custody without a transfer.
- A price exists after the cutoff but not at the cutoff.
- An asset uses a different decimal scale than the assumed default.
