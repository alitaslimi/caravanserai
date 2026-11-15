from __future__ import annotations


def plan_ranges(from_block: int, to_block: int, span: int) -> list[dict[str, int]]:
    if from_block >= to_block:
        raise ValueError("expected a non-empty half-open range")
    if span < 1:
        raise ValueError("span must be positive")
    return [
        {"from_block": start, "to_block": min(start + span, to_block)}
        for start in range(from_block, to_block, span)
    ]


def validate_contiguous(
    results: list[dict[str, int | str]], expected_start: int, expected_end: int
) -> int:
    ordered = sorted(results, key=lambda item: int(item["from_block"]))
    if not ordered:
        raise ValueError("no completed ranges")
    if int(ordered[0]["from_block"]) != expected_start:
        raise ValueError("first range does not match the expected start")
    if int(ordered[-1]["to_block"]) != expected_end:
        raise ValueError("last range does not match the expected end")
    for left, right in zip(ordered, ordered[1:]):
        if int(left["to_block"]) != int(right["from_block"]):
            raise ValueError("range gap or overlap")
    return expected_end

