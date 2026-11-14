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
time: "15 minutes"
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
