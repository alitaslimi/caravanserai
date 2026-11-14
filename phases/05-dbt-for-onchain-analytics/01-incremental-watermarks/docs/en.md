---
title: "Choosing an incremental watermark"
phase: "Transformation and Incremental Modeling"
phaseNumber: 5
lessonNumber: 1
type: "Concept"
status: "draft"
tools: ["dbt", "ClickHouse"]
chains: []
protocols: []
datasets: []
time: "20 minutes"
---

# Choosing an incremental watermark

## Define the recovery contract

An incremental model reads a subset of its source on each run. A watermark marks the progress used to choose that subset. Give each independently advancing stream its own watermark. If one market catches up while another is paused, a shared maximum can skip the paused market's history.

A bounded lookback repeats some work to accommodate late data. Repeating a range only works safely when the write strategy handles duplicate keys and corrections. Define both together.

## Compare the two windows

```bars
{
  "caption": "Synthetic outage fixture. The model last processed block 110 and the source reached 130. With a five-block lookback, the tip window starts at 125 and leaves blocks 111 through 124 unprocessed.",
  "unit": "blocks missed",
  "max": 20,
  "rows": [
    [
      "Model-head window",
      0
    ],
    [
      "Source-tip window",
      14
    ]
  ]
}
```

| Window | What it can handle | Failure to test |
| --- | --- | --- |
| Last processed block plus lookback | Catch-up from the model's previous progress | Quiet or empty streams may repeatedly scan old history |
| Source tip plus lookback | Predictable bounded scan at the tip | An outage longer than the lookback can leave a gap |

An ingestion range ledger can help with historical replays. Track which ranges the source rewrote since the last successful processing checkpoint. Translate them into the scan bounds your warehouse can prune. Test a replay from the start of chain history, since one broad range can dominate the cost until it ages out of a capped lookback.

## Lab

Use a synthetic source with blocks 100 through 130 and a five-block lookback. Leave the model at block 110 while the source advances to 130. Compare the keys selected by a model-head cutoff with those selected by a tip cutoff. Repeat with a quiet market whose last event is at block 100. Count both scanned and missed rows.

In a dbt and ClickHouse implementation, inspect the compiled predicates and the generated writes, then verify distinct keys and payloads in the result. A successful run or completed mutation is evidence that the statement ran. The row comparison establishes whether the repair worked.
