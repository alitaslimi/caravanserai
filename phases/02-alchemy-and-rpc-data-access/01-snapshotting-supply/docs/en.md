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

## Field note

In the multichain supply project, nine daily checks matched transfer-derived supply to the unit on the chains sampled. That supported reusing the existing daily series for those deployments. It did not establish parity for every token design or give hourly observations. The same session recorded per-item throttle errors in successful HTTP batch responses. A client that checked only HTTP status missed those failures.

## Lab

Given block timestamps 13:59:50, 13:59:58, and 14:00:12 UTC, use the second block for the 14:00 cutoff. Simulate a batch with one success and one throttled item. Persist the successful observation and retry the failed request by ID.
