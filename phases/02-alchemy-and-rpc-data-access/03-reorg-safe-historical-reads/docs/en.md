---
title: "Making historical reads reorg safe"
phase: "RPC and Historical State"
phaseNumber: 2
lessonNumber: 3
type: "Build"
status: "draft"
tools: ["JSON-RPC", "Python"]
chains: ["EVM"]
protocols: []
datasets: ["blocks", "state calls", "checkpoints"]
time: "60 minutes"
---

# Making historical reads reorg safe

## Why It Matters

A successful RPC response is an observation, not proof that the response will remain canonical. Head blocks can be replaced, providers can lag one another, and a timestamp can map to different blocks if the lookup rule is vague. Historical analytics needs an explicit finality policy and checkpoints anchored to block hashes.

## Outcomes

- Separate head, safe, finalized, and confirmation-depth policies.
- Resolve a timestamp to a block with a documented boundary rule.
- Detect a reorg by comparing checkpoint ancestry.
- Rewind only the affected range and replay idempotently.
- Record enough evidence to reproduce a historical state call.

## Choose a finality policy

Do not hide finality inside a magic subtraction. Store the policy with the run:

| Policy | Useful for | Main limitation |
| --- | --- | --- |
| Head | Low-latency monitoring | Expected to change |
| Safe or finalized tag | Chains and providers that implement the tag | Availability and semantics vary |
| Confirmation depth | Portable operational fallback | Depth is a risk choice, not a proof |
| Fixed historical cutoff | Reproducible research | Does not serve a live tail |

A pipeline can ingest the head into a provisional layer while publishing only through its accepted boundary. Consumers should be able to see that boundary.

## Resolve time without ambiguity

Define whether “state at midnight” means the last block with timestamp strictly before midnight or the first block at or after midnight. For an end-of-day balance, a common definition is the last canonical block whose timestamp is less than the next day's midnight.

Use binary search over block timestamps, then store:

- requested UTC timestamp and comparison rule;
- resolved block number, block hash, and block timestamp;
- chain ID and RPC method;
- provider family and retrieval time;
- finality policy at retrieval.

Pin `eth_call`, `eth_getBalance`, and storage reads to that resolved block tag. Never resolve a time and then call against `latest`.

## Checkpoint by identity, not height alone

A durable checkpoint should contain at least `chain_id`, `last_block_number`, `last_block_hash`, `parent_hash`, `finality_policy`, `source`, and `committed_at`. On restart, fetch the checkpointed height and compare its hash.

If it differs, walk backward through stored parent links and current canonical headers until a common ancestor is found. The first replay height is `common_ancestor + 1`. Bound the maximum automatic rewind; a deeper mismatch should stop for investigation rather than silently replace a large history.

```flow
{
  "caption": "A restart validates ancestry before requesting new data.",
  "steps": [
    "Load the durable checkpoint",
    "Refetch its block header",
    "Compare the stored and current hash",
    "Find a bounded common ancestor if needed",
    "Invalidate affected derived partitions",
    "Replay and commit a new checkpoint"
  ]
}
```

## Make the replay idempotent

The write contract must tolerate receiving the same canonical records again. Options include staging a bounded range and replacing it transactionally, inserting versions then selecting the latest, or deleting and rebuilding a validated partition. Engine-level deduplication is not a substitute for declaring the logical key.

Reorg handling propagates downstream. Decoded events, balances, aggregates, and cached API responses derived from replaced blocks are also stale. Record lineage from repair range to downstream models so the repair plan is explicit.

## Lab

Run `code/chain_cursor.py`. The fixture begins with blocks `100` through `102`, then presents an alternative block `102` with the same parent. Confirm that the cursor identifies `101` as the common ancestor and proposes replay from `102`. Extend the fixture with a changed block `101` and verify that replay begins at `101`.

Then sketch the metadata row for a historical `eth_call` at the accepted block. The result alone is not sufficient evidence.

## Checks

- Is the published cutoff visible independently from the ingested head?
- Does every historical state result include a block hash?
- Can a restart distinguish source lag from a canonical replacement?
- Is automatic rewind bounded and observable?
- Does repair invalidate downstream data derived from the same block range?

## Next Steps

Apply the same identity-based range contract to bulk extraction, where retries and backpressure add another failure surface.

