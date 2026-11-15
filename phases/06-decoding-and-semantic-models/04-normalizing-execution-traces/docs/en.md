---
title: "Normalizing EVM execution traces"
phase: "Decoding & Semantic Models"
phaseNumber: 6
lessonNumber: 4
type: "Build"
status: "draft"
tools: ["JSON-RPC", "Python"]
chains: ["EVM"]
protocols: []
datasets: ["traces", "receipts", "transactions"]
time: "80 minutes"
---

# Normalizing EVM execution traces

## Why it matters

Logs describe explicit contract emissions, but they do not expose every internal call, native-value movement, deployment, revert path, or self-destruct effect. Trace APIs fill that gap, yet there is no single universal trace payload. Geth-style call trees, parity-style flat traces, provider-enhanced methods, and indexed trace datasets require a deliberate normalization contract.

## Outcomes

- Compare call-tree and flat trace representations.
- Preserve call ancestry and execution order without relying on array position.
- Distinguish call success, child failure, and transaction failure.
- Normalize native value, creation, delegate call, and revert data.
- Measure trace coverage independently from decoded business events.

## Canonical call-frame grain

Use one row per execution frame. A neutral schema should include:

- chain, block, transaction, and transaction position;
- a structural `trace_address` path and parent path;
- call type, from, to, value, gas, gas used, input, and output;
- created address and runtime code where supported;
- frame error and revert data;
- source API family, tracer configuration, and retrieval revision.

The root frame uses an empty path. Child paths append the child index, such as `[0]`, `[0, 1]`, and `[2]`. For a call tree, derive paths during traversal. For a flat API, validate and retain the supplied path. Array order is not a stable identity.

## Semantics that need care

`DELEGATECALL` executes another contract's code in the caller's storage context. Its `to` address identifies code, not asset custody or the effective event emitter. Contract creation can expose a created address in a result field rather than `to`. A frame can fail while its parent handles the failure and the transaction succeeds. Preserve frame-level error separately from receipt status.

Native value on an attempted reverted frame is not a successful economic transfer. Publish successful native transfers only after applying the trace family's failure semantics and ancestor failure state. Retain failed frames for debugging and behavioral analysis.

## Coverage before interpretation

For each bounded range, compare:

- expected transaction count from canonical blocks;
- trace-requested and trace-supported transaction count;
- returned roots and transactions with no trace result;
- per-method errors and timeouts;
- frame count by call type and chain era;
- receipt status versus normalized root status.

“No internal calls” and “trace unavailable” are different states. A provider can support core RPC while limiting trace methods by network, history, or plan.

## Lab

Run `code/normalize_traces.py`. It converts a synthetic call tree into flat canonical frames. Add a failed child call and confirm that the failure stays on that frame. Add a `DELEGATECALL` and verify that code address is retained without relabeling it as the storage owner.

Create an equivalent flat fixture and reconcile by transaction hash plus trace address. The two normalized key sets and selected values should match even though the source payloads differ.

## Acceptance criteria

- Every frame has one deterministic path within its transaction.
- Parent paths exist unless the frame is the root.
- Frame failure and transaction failure remain separate.
- Successful native-value metrics exclude reverted paths.
- Coverage reports unsupported and uncollected traces explicitly.

## Public references

- [dRPC: debug and trace methods](https://drpc.org/docs/ethereum-api/debugandtrace)
- [Envio: decoding traces](https://docs.envio.dev/docs/HyperSync/tutorial-decoding-traces)

