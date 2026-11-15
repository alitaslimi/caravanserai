---
title: "Defining metric publication contracts"
phase: "Publishing Analytics"
phaseNumber: 10
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["SQL", "HTTP API"]
chains: ["EVM"]
protocols: []
datasets: ["metrics", "freshness", "coverage"]
time: "65 minutes"
---

# Defining metric publication contracts

## Why It Matters

A chart can render while its data is partial, stale, or defined differently from its headline. Publication is a data contract: consumers need the metric definition, grain, units, time boundary, freshness, source coverage, and failure behavior alongside the values.

## Outcomes

- Define a metric independently from its visual presentation.
- Distinguish event time, processing time, and publication time.
- Represent zero, missing, partial, and stale results explicitly.
- Reconcile detail series, grouped views, and headline totals.
- Design an endpoint that fails closed on unsafe partial data.

## The contract before the query

For each published metric document:

| Property | Example question |
| --- | --- |
| Grain | Is one row a chain-day, token-day, or protocol-day? |
| Population | Which event types, addresses, and eras are included? |
| Measure | Is the value gross flow, net flow, stock, count, or distinct entity count? |
| Units | Raw integer, token units, or converted currency? |
| Time rule | UTC day, trailing window, or last complete period? |
| Cutoff | Through which block and timestamp is source data accepted? |
| Revision | Which model and metric definition produced the value? |
| Coverage | Which chains, assets, and required sources are complete? |

Metric names are not definitions. “Volume,” “active users,” and “TVL” each admit multiple valid formulas.

## Four result states

- **Zero**: the complete population was evaluated and no qualifying value occurred.
- **Missing**: no result is available for a required key or interval.
- **Partial**: some required sources or dimensions are absent.
- **Stale**: a prior complete result exists, but its freshness exceeds the contract.

Do not replace all four with zero. Return machine-readable status and coverage fields. A UI can choose how to display them without inventing semantics.

## Align time boundaries

Keep these clocks visible:

1. Event time from the containing block.
2. Ingestion or transformation completion time.
3. Publication or cache generation time.

A daily metric should usually publish only complete UTC periods, unless it is clearly labeled as partial. A live metric should expose its accepted block cutoff and observed head so consumers can calculate lag without guessing.

## Reconcile every presentation level

For a grouped time series and headline total, assert:

- group sums equal the ungrouped total at the same cutoff;
- daily sums equal the requested window total;
- pagination or top-N behavior does not hide an “other” bucket;
- currency conversion uses the same price timestamp and coverage rule;
- dimensions with missing prices are reported, not silently removed.

Run these checks in the publication layer, not only in a dashboard test.

## Partial-failure policy

Classify dependencies as required or optional. If a required chain partition or price source is incomplete, return an explicit unavailable or partial response according to the contract. If an optional label service fails, return the metric with a warning and unlabeled categories.

A cached last-known-good value can be useful, but it must carry its original cutoff and a stale status. Changing `generated_at` while serving old data creates false freshness.

## Endpoint shape

The example in `code/metric_response.json` separates values from operational metadata. Keep the response stable while allowing new warning codes. Do not expose provider credentials, internal hostnames, or unreviewed query text.

Useful observability includes request latency, cache age, result status, data cutoff lag, missing dimensions, model revision, and reconciliation failures. Usage counts and billed cost are different measures and should not be conflated.

## Lab

Define a synthetic daily transfer metric. Produce four fixtures: complete with activity, complete with zero activity, partial price coverage, and stale last-known-good. Write consumer tests that render or reject each case according to the contract.

Then run a reconciliation query proving that the headline total equals the sum of displayed groups plus an explicit `other` group. Change one group filter and confirm the check fails.

## Checks

- Can a consumer distinguish zero from unavailable without reading prose?
- Does every response expose the data cutoff separately from generation time?
- Are definition and model revisions traceable?
- Do grouped and headline values use identical filters and units?
- Is old cached data labeled stale rather than regenerated?

## Next Steps

Use this contract in the capstone, where a deliberately duplicated extraction range must be repaired before the metric returns to complete status.

