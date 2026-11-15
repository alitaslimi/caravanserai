---
title: "Testing event decoders"
phase: "Decoding & Semantic Models"
phaseNumber: 6
lessonNumber: 1
type: "Case Study"
status: "draft"
tools: ["ClickHouse"]
chains: []
protocols: []
datasets: []
time: "50 minutes"
---

# Testing event decoders

## Use several independent checks

Start by scoping raw events to the chain, emitter, signature, and deployment interval. Compare the decoded output by full event key. A matching count can hide a missing event and a duplicated one. Compare typed values after agreeing on signedness, units, and representation.

```flow
{
  "caption": "Decoder verification from the raw event set to the published rows.",
  "steps": [
    "Scope raw emitters and event signatures",
    "Check missing and extra keys",
    "Compare independently decoded fields",
    "Recompute protocol-derived identifiers",
    "Inspect failures by deployment era"
  ]
}
```

## Field note

One staging comparison showed that an available decoded feed could omit entire emitter and event combinations. Another protocol used a generic emitter with nested keyed data and version-specific fields. The event name discriminator lived in an indexed topic, and the outer event signature alone did not identify the business event. Keep optional version-dependent fields distinguishable from zero values.

## Lab

Take one raw log and decode it twice, using a library and an independent word-level interpretation for fixed-width fields. Compare signed values and preserve a fixture from each deployment era. Then remove one expected raw key from the decoded output and confirm that the completeness test detects it.

## Test layers

Use three layers of evidence. Unit fixtures test byte layout, signed integers, dynamic offsets, and indexed topics. Coverage tests compare raw eligible keys with decoded success and failure keys. Semantic tests verify roles, units, direction, and protocol invariants after decoding.

A decoder may be byte-correct while the event scope is wrong. Negative fixtures should include the right signature from the wrong emitter, the right emitter outside its deployment era, truncated data, an unknown discriminator, and an ABI that matches the signature but not the historical implementation.

## Failure drill

Flip the highest bit of a signed 256-bit delta and confirm that unsigned interpretation produces a large positive value while the correct decoder produces a negative value. Move one indexed field into data and confirm the malformed fixture is rejected. Add a valid raw key with an unknown ABI era and ensure it appears in failure coverage rather than disappearing.

## Acceptance criteria

- Fixtures retain original topics, data, emitter, chain, and historical position.
- Expected failures are classified and queryable.
- Raw eligible keys equal decoded successes plus recorded failures.
- Tests span every known ABI era and its exact boundary.
- Semantic values preserve signed raw units before scaling.
