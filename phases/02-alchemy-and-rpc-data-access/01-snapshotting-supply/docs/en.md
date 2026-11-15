---
title: "Snapshotting token supply"
phase: "RPC and Historical State"
phaseNumber: 2
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["Alchemy"]
chains: []
protocols: []
datasets: []
time: "45 minutes"
---

# Snapshotting token supply

## Pin the state to a block

For an hourly EVM supply observation, find the last canonical block at or before the requested UTC hour. Read the token contract at that block and record the requested cutoff, the actual block time, block number and hash, and the raw response. The same block can answer several requested cutoffs, so keep the observation schedule separate from the state-read key.

```flow
{
  "caption": "Historical supply observations on EVM chains.",
  "steps": [
    "Choose a UTC cutoff",
    "Resolve the last eligible block",
    "Read totalSupply at that block",
    "Persist raw units and block identity",
    "Reconcile against an independent series"
  ]
}
```

## Provider note

Alchemy, dRPC, and other JSON-RPC services expose the same core Ethereum methods, but historical-state depth, trace methods, batch limits, archival coverage, and throttling behavior can differ by provider, chain, and plan. Probe each capability independently. A batch can return HTTP 200 while individual JSON-RPC items contain errors, so match responses by `id` and retry failed items rather than treating the HTTP status as the batch result.

## Lab

Given block timestamps 13:59:50, 13:59:58, and 14:00:12 UTC, use the second block for the 14:00 cutoff. Simulate a batch with one success and one throttled item. Persist the successful observation and retry the failed request by ID.

## Observation model

Separate the requested schedule from the state observation. Several hourly cutoffs can legitimately resolve to the same block on a slow or interrupted chain. Key the contract read by chain, contract, method, arguments, and block hash; map requested timestamps to that observation in a separate table.

Store the raw integer result, decimals or scaling metadata revision, block timestamp, provider family, retrieval time, and finality policy. Supply formulas derived from several contract fields must record every call at the same block. Never combine a historical numerator with a current denominator.

## Failure drill

Return a successful batch containing an archive-state error, a throttled item, and a valid zero supply. The adapter should classify all three differently. Replace the resolved block hash in a simulated reorg and verify that the observation is invalidated and reread rather than silently retaining the old state.

## Acceptance criteria

- Timestamp resolution uses one documented before-or-at boundary rule.
- Every value is pinned to a block number and hash.
- Valid zero, unsupported history, and transient failure remain distinct.
- Batch items reconcile by request ID.
- Independent supply evidence is compared at the same chain cutoff and units.
