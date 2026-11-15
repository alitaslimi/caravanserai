---
title: "Pairing bridge transfers across chains"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 2
type: "Case Study"
status: "draft"
tools: []
chains: []
protocols: ["LayerZero"]
datasets: []
time: "15 minutes"
---

# Pairing bridge transfers across chains

## Preserve both sides of the transfer

Use a stable namespaced identifier for the transfer when the protocol supplies one. Record source and destination chain, token, amount, decimals, timestamp, and transaction identity separately. A send can be observed before its receive. A join that drops unmatched sends makes the dataset look healthier than the evidence supports.

```flow
{
  "caption": "Send-only and receive-only records stay visible in the conformed fact.",
  "steps": [
    "Decode send and receive independently",
    "Map protocol chain IDs",
    "Pair by namespaced transfer ID",
    "Keep unmatched legs",
    "Value using a documented side preference"
  ]
}
```

## Field note

The bridge model used one row per transfer and a full outer join to preserve unmatched legs. It mapped protocol endpoint IDs through a registry. Some token attribution came from transfers colocated in the same transaction. Mark such attribution as inferred, since a transaction can contain several candidate token movements.

## Lab

Create one matched transfer, one send-only transfer, and one ambiguous token attribution. Reconcile the source and destination counts separately. Verify that adding a receive in a later run updates the existing transfer key.

Implement the full outer join in `code/pair_bridge_legs.sql`. The lab passes when unmatched legs survive, a late receive updates one logical transfer, duplicate legs fail a uniqueness check, and source and destination amounts are compared before valuation.

## Failure cases to test

- Protocol message IDs collide across deployments unless namespaced.
- A destination leg arrives after the source reporting window.
- Fees make source and destination amounts intentionally different.
- Token attribution finds several transfers in one transaction.
- A protocol chain identifier is mapped to the wrong canonical chain ID.
