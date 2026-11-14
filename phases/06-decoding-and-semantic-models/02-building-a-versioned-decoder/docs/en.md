---
title: "Building a version-aware event decoder"
phase: "Decoding & Semantic Models"
phaseNumber: 6
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["Python", "JSON-RPC", "Envio"]
chains: ["EVM"]
protocols: []
datasets: ["logs", "contract deployments", "ABIs", "decoded events"]
time: "60 minutes"
---

# Building a version-aware event decoder

## Why It Matters

A decoder turns bytes into claims about business activity. Correct ABI syntax is necessary but insufficient: the pipeline must scope the right emitters and deployment eras, preserve raw provenance, handle signed and dynamic values, and detect coverage gaps when contracts upgrade.

## Outcomes

- Decode indexed topics and fixed-width data words.
- Preserve full raw event identity beside decoded fields.
- Select an ABI by chain, emitter, and block interval.
- Distinguish missing optional fields from zero values.
- Validate decoding through independent methods and invariants.

## Raw event identity

Retain these fields on every decoded record:

```text
chain_id
block_number
block_hash
transaction_hash
transaction_index
log_index
contract_address
topic0
topics
data
decoder_version
abi_version
```

The decoded row should remain traceable to exactly one raw log. A count without the full key can hide one missing event and one duplicate event.

## ABI selection

Use an interval registry rather than one current ABI per address:

| Field | Meaning |
| --- | --- |
| `chain_id` | Network identity |
| `contract_address` | Log emitter |
| `valid_from_block` | Inclusive start |
| `valid_to_block` | Exclusive end or null |
| `abi_version` | Stable ABI identifier |
| `implementation_address` | Resolved implementation when applicable |
| `resolution_evidence` | Creation, storage slot, upgrade event, or verified metadata |

Proxy history matters because replaying old logs with the latest implementation ABI can silently reinterpret or omit events. Preserve creation and upgrade evidence and perform point-in-time ABI selection.

## Indexed and non-indexed fields

- `topic0` is normally the Keccak-256 event signature.
- Indexed static values occupy later topics as 32-byte words.
- Indexed dynamic values contain a hash, not the original value.
- Non-indexed values are ABI encoded in `data`.
- Signed integers use two's-complement representation.
- Dynamic arrays, strings, and bytes use offsets into the data payload.

The dependency-free code example decodes a synthetic fixed-width event:

```solidity
event ValueChanged(address indexed actor, int256 delta, bytes32 recordId);
```

Its `topic0` is deliberately synthetic. A production decoder should compute or obtain the signature hash from an ABI using a Keccak-256 implementation; Python's `hashlib.sha3_256` is not Ethereum Keccak-256.

## Validation ladder

1. **Shape:** topic count, data length, and address/word widths.
2. **Key coverage:** missing and extra raw log keys.
3. **Typed values:** signedness, decimals, nullability, and byte ordering.
4. **Independent decode:** compare with another library, provider, or manual word interpretation.
5. **Contract invariant:** recompute an identifier or conservation rule where one exists.
6. **Era coverage:** include a fixture from every deployment and ABI interval.

Provider-decoded records are a useful cross-check, not a substitute for coverage testing. Compare the expected raw emitter/signature set with the provider's decoded keys before migrating a pipeline.

## Field naming

Prefer role and unit over protocol vocabulary:

- `actor_address`, `sender_address`, `recipient_address`;
- `amount_raw`, `delta_raw`, `fee_raw` for integer units;
- `amount`, `delta`, `fee` only after a precise decimal conversion;
- `block_timestamp`, `block_number`, `transaction_hash`, `log_index` for provenance;
- `event_name`, `decoder_version`, and `abi_version` for interpretation.

Do not reuse `value` for unrelated roles or silently coerce an absent field to zero.

## Lab

Run `python -m unittest` inside `code/`. The fixture contains a positive and negative signed delta. Add a second ABI interval that renames the semantic role without changing the raw field, then keep the normalized output name stable. Remove one decoded key and confirm that a key-set comparison—not a count alone—detects the gap.

## Checks

- Can every decoded row be joined back to one raw log?
- Does ABI selection use the event's block rather than today's implementation?
- Are raw integer units preserved before decimal scaling?
- Is a missing field distinguishable from an explicit zero?
- Does the test set cover upgrades and uncommon signed values?

## Next Steps

Build a staging model that performs only renaming, typing, and light filtering, then conform several decoder-specific event shapes into one analytical concept.
