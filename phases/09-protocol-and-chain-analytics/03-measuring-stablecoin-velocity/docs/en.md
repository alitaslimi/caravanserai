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

## Field note

The gap mattered because end-of-window market cap was about 1.65 times the period average. Using average daily volume with that same end-of-window denominator would change the unit without fixing the mismatch. The audit also found symbol collisions across bridged tokens and inflated transfer volume from some mint and burn activity. Group by a canonical token identity and document exclusions.

## Lab

Construct two tokens with the same period volume and average market cap. Give one a rising supply series. Compare both denominator choices and explain which result changes. Repeat with a missing price day and record how the metric reports incomplete coverage.
