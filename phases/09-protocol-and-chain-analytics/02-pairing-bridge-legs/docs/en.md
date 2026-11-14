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
