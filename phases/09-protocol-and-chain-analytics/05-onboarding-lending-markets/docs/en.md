---
title: "Onboarding a lending market"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 5
type: "Case Study"
status: "draft"
tools: ["dbt"]
chains: []
protocols: ["Aave"]
datasets: []
time: "15 minutes"
---

# Onboarding a lending market

## Declare the deployment before reading its events

A lending protocol may have several markets on a chain. Use a registry keyed by chain and market to record deployment bounds and contract roles. In the Aave V3 example, each entry carried both relevant contract roles so the event model could select the appropriate emitter. Scope an event using its signature and the configured deployment.

## Give new markets their own progress

A new market needs history from its deployment block even when another market on the same chain is already at the tip. For an existing market, start from its own recorded progress with a documented overlap. For sparse streams, distinguish the last observed event from verified coverage. A week without an event can be normal and should be evaluated against the expected raw range.

```flow
{
  "caption": "Onboarding a market alongside an existing deployment.",
  "steps": [
    "Register contract roles and first block",
    "Plan a range per market",
    "Decode and reconcile the historical rows",
    "Verify one row per event key",
    "Enable the scheduled incremental run"
  ]
}
```

## Lab

Market A is loaded through block 120. Market B launches at block 105 and emits at blocks 106 and 118. Both share a chain, and the source tip is 125. A chain-wide cutoff of 120 loses both B events. Compare a per-market plan, then replay the overlap and verify distinct event keys. In the production checks, parity was measured at the staging head to keep lag separate from decoding defects.

Use `code/market_ranges.sql` to produce one extraction range per deployment. The lab passes when a new market begins at its own deployment block, quiet markets retain verified coverage, and overlapping replay does not create duplicate event keys.

## Failure cases to test

- Two market roles emit events with the same signature but different meaning.
- A new market inherits the chain-wide watermark and loses its history.
- No events occur during a verified interval and progress appears stale.
- A market upgrade changes the relevant emitter.
- Reserve metadata is read from current state and applied retroactively.
