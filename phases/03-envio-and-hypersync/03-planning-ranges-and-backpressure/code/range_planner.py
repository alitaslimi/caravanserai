from dataclasses import dataclass


@dataclass(frozen=True)
class Range:
    start: int
    end: int

    def __post_init__(self) -> None:
        if self.end < self.start:
            raise ValueError("end must not precede start")


def next_span(current: int, payload_bytes: int, target_bytes: int) -> int:
    """Apply asymmetric control: shrink quickly and grow conservatively."""
    if payload_bytes > target_bytes * 2:
        return max(1, current // 2)
    if payload_bytes < target_bytes // 2:
        return min(current + max(1, current // 4), 100_000)
    return current


def next_range(committed_end: int, span: int) -> Range:
    return Range(committed_end, committed_end + span)


if __name__ == "__main__":
    assert next_span(1_000, 3_000_000, 1_000_000) == 500
    assert next_span(1_000, 200_000, 1_000_000) == 1_250
    assert next_range(5_000, 500) == Range(5_000, 5_500)
    print("range planner checks passed")

