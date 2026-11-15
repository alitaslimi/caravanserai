from dataclasses import dataclass

@dataclass(frozen=True)
class Change:
    position: int
    delta: int

def replay(anchor_value: int, anchor_position: int, changes: list[Change]) -> int:
    return anchor_value + sum(c.delta for c in changes if c.position > anchor_position)

if __name__ == "__main__":
    assert replay(80, 10, [Change(11, 7)]) == 87
    assert replay(92, 20, [Change(21, -3)]) == 89
    print("governance era replay passed")
