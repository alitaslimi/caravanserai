---
title: "Measuring stablecoin velocity"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 3
type: "Case Study"
status: "draft"
tools: []
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Measuring stablecoin velocity

## Align stock and flow windows

For the velocity measure used in this project, sum transfer volume over complete days and divide it by the average market cap across the same days. The result is turns over the selected window. Define eligible transfer volume, pricing, and circulating supply before calculating the ratio.

```bars
{
  "caption": "Observed 30-day stablecoin comparison using the same transfer-volume numerator. The denominator changed from end-of-window market cap to average market cap over the window.",
  "unit": "turns",
  "rows": [
    [
      "End-of-window market cap",
      26.9
    ],
    [
      "Average market cap over 30 days",
      44.5
    ]
  ]
}
```

## Metric note

An end-of-window denominator and a period-average numerator describe different time bases. Changing total volume to average daily volume does not fix that mismatch. Group bridged or wrapped deployments by a documented canonical identity, and state whether mint, burn, bridge, exchange, and internal treasury flows are included.

## Lab

Construct two tokens with the same period volume and average market cap. Give one a rising supply series. Compare both denominator choices and explain which result changes. Repeat with a missing price day and record how the metric reports incomplete coverage.
