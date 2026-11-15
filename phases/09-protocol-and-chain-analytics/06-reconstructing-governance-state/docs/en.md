---
title: "Reconstructing governance state across an upgrade"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 6
type: "Case Study"
status: "draft"
tools: []
chains: ["Arbitrum"]
protocols: []
datasets: []
time: "15 minutes"
---

# Reconstructing governance state across an upgrade

## Identify the anchor and its clock

To reconstruct a governance quantity, start from a contract state observation at a known checkpoint. Apply only the events that change that quantity. Record the chain and block coordinate used by the contract. In the Arbitrum case, governance checkpoints used Ethereum L1 block numbers, so joining them directly to L2 block heights gave the wrong ordering.

An upgrade can initialize state without emitting the event a replay expects. When the contract resets or corrects the quantity, record a new anchor and resume replay from there. Keep the old segment so proposals before the upgrade use the historic rules.

```flow
{
  "caption": "Replay on either side of a state correction using an explicit anchor per era.",
  "steps": [
    "Read the pre-upgrade anchor",
    "Apply eligible changes in checkpoint order",
    "Verify the upgrade applied",
    "Read the new anchor",
    "Reconcile reconstructed checkpoints to contract reads"
  ]
}
```

## Field note

The reconstruction used a separate adjustment event because the delegation adjustment did not emit the regular vote-change event. A timelock execution record established that a call ran, and the follow-up state checks established that the correction took effect. Keep transaction evidence and checkpoint values with the fixture.

## Lab

Start at an observed value of 80, apply a +7 event, then re-anchor to the contract-observed value of 92 at the upgrade. Apply a later -3 event. The expected result is 89. Check an observation on each side of the upgrade and confirm that the replay only uses events after the corresponding anchor.

Run `code/governance_replay.py` and add an omitted adjustment at the upgrade. The replay must disagree with the checkpoint until a new anchor is introduced. Preserve the coordinate system of each checkpoint rather than assuming every block number belongs to the execution chain.

## Failure cases to test

- A checkpoint stores an L1 block number while events are ordered by L2 height.
- An upgrade initializes state without the normal change event.
- A proposal snapshot uses rules from the wrong governance era.
- Signed adjustments are converted to absolute values.
- Two events at one block require transaction ordering.
