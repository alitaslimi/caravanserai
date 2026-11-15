---
title: "Resolving address labels with provenance"
phase: "Protocol & Chain Analytics"
phaseNumber: 9
lessonNumber: 7
type: "Case Study"
status: "draft"
tools: []
chains: []
protocols: []
datasets: []
time: "15 minutes"
---

# Resolving address labels with provenance

## Store assertions and resolve a view

An address label is a claim about a chain-scoped subject made by a source during an interval. Store the namespace, claimed value, source, and effective range. Resolve conflicts using explicit precedence per namespace and source, with a stable tie-breaking rule. This lets the same source be authoritative for one property and lower priority for another.

```flow
{
  "caption": "Preserve evidence before publishing a single resolved value per namespace.",
  "steps": [
    "Collect chain-scoped assertions",
    "Match the requested effective date",
    "Apply namespace precedence",
    "Publish resolved value and provenance",
    "Verify join grain before enrichment"
  ]
}
```

## Field note

The label project kept all assertions and resolved them separately. Storage deduplication could not express the desired precedence. Entity attributes belonged on the entity dimension, where multiple addresses could refer to the same entity. Reporting eligibility needs its own explicit rule, particularly where a label is being used to infer a holding or attribute revenue.

## Lab

Assign one address two competing labels for the same namespace and a third label in another namespace. Resolve it at two dates, with the higher-priority assertion expiring in between. Join the resulting dimension to a balance fact and check that the row count and total balance stay stable. A duplicate winning row should fail the join-grain check.

Use `code/resolve_labels.sql` to resolve one assertion per chain, address, namespace, and effective date. The lab passes when the winner is deterministic, expired claims stop applying, and enrichment preserves fact row count and value totals.

## Failure cases to test

- The same hexadecimal address is labeled on the wrong chain.
- Two equally ranked assertions produce nondeterministic winners.
- A label changes historically but the dimension stores only its current value.
- An entity-level attribute is copied to every address without a stated rule.
- A many-to-many label join multiplies balances or revenue.
