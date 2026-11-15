---
title: "Resolving proxies and ABI eras"
phase: "Decoding & Semantic Models"
phaseNumber: 6
lessonNumber: 3
type: "Build"
status: "draft"
tools: ["Python", "SQL"]
chains: ["EVM"]
protocols: []
datasets: ["contract registry", "ABIs", "logs", "traces"]
time: "85 minutes"
---

# Resolving proxies and ABI eras

## Why It Matters

A contract address does not guarantee one implementation or one ABI forever. Proxies can change implementation, factories can deploy many instances, and identical event signatures can carry different domain meaning across deployments. A decoder that selects an ABI only by address and present-day state can silently reinterpret history.

## Outcomes

- Model contract identity separately from deployed code and protocol role.
- Resolve an ABI by chain, address, and block interval.
- Handle proxy upgrades without rewriting raw logs.
- Quarantine ambiguous or failed decodes with provenance.
- Test decoder behavior at deployment and upgrade boundaries.

## Four identities to keep separate

1. **Chain address** identifies an account on one chain.
2. **Code identity** can be represented by runtime bytecode hash or implementation address.
3. **ABI version** describes encoding knowledge used by a decoder revision.
4. **Semantic role** states what the deployment means to the analytical model.

These identities often overlap, but none is a safe universal substitute for the others. A proxy address can keep its role while its code and ABI change. A factory can deploy the same code at many addresses with different configuration.

## Use interval-based registry entries

A practical registry row includes:

| Field | Meaning |
| --- | --- |
| `chain_id` | Network namespace |
| `contract_address` | Address that emitted the log or received the call |
| `valid_from_block` | Inclusive first block for this resolution |
| `valid_to_block` | Exclusive end, nullable for the open era |
| `implementation_address` | Resolved implementation when applicable |
| `runtime_code_hash` | Evidence about deployed code |
| `abi_id` | Immutable reference to ABI content |
| `decoder_version` | Code revision that interprets the ABI |
| `resolution_source` | Verified source, deployment manifest, storage read, or trace evidence |
| `confidence` | Explicit review state, not a hidden assumption |

Require non-overlapping intervals for the same chain and address. The registry should fail closed when two entries match a block.

## Discovering upgrades

No single method covers every proxy design. Combine evidence appropriate to the contract family:

- known implementation storage slots read at explicit blocks;
- emitted upgrade events scoped to a verified proxy address;
- deployment and factory events;
- runtime bytecode hashes;
- creation traces or transaction inputs;
- published deployment manifests and verified source metadata.

Record the evidence, block, and retrieval time. Do not assume that an event named `Upgraded` is authoritative when emitted by an unrelated contract.

## Decode deterministically

The decoder input should include chain ID, emitting address, block number, topics, and data. Resolution returns exactly one ABI era or an explicit failure. Save:

- raw natural key and raw bytes reference;
- matched ABI ID and registry entry;
- decoder version;
- decoded field names, types, and raw integer values;
- decode status and structured failure reason.

Keep failure rows. A rising `unknown_abi` or `ambiguous_era` count is an operational signal that discovery or registry maintenance is incomplete.

## Boundary tests

For every era transition, create fixtures at:

- the block immediately before the change;
- the first block in the new era;
- an event unique to the old ABI;
- an event unique to the new ABI;
- a shared signature whose interpretation must remain stable;
- an address and chain that should not match.

Also test ordering within the upgrade block if the implementation changes mid-block. A block-level interval may be insufficient; the registry may need transaction or log position for exact historical interpretation.

## Semantic modeling after decoding

Decoding answers “what typed values are encoded?” It does not automatically answer “what economic action occurred?” Keep the semantic layer separate so it can:

- map event parameters to roles such as sender, receiver, owner, or asset;
- preserve signed direction rather than applying absolute value;
- convert raw units using versioned token metadata;
- combine multiple events that represent one domain action;
- expose the registry and decoder revision used.

## Lab

Run `code/abi_registry.py`. It registers two non-overlapping eras for one synthetic proxy and resolves blocks on both sides of the boundary. Add an overlapping era and confirm that validation fails. Then add a second chain with the same address and verify that chain identity prevents a false match.

Create two event fixtures that share an emitter but require different ABI IDs. The expected output must include both `abi_id` and `decoder_version`, not only decoded values.

## Checks

- Is registry lookup scoped by chain, address, and historical position?
- Are implementation discovery and ABI selection supported by recorded evidence?
- Does ambiguity stop decoding instead of choosing the first match?
- Are decode failures queryable and included in coverage metrics?
- Can a corrected registry replay semantics without refetching raw logs?

## Next Steps

Feed decoder coverage and ambiguity counts into the quality ladder, then reconcile high-value event families against an independent extraction or contract invariant.

