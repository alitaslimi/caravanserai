from dataclasses import dataclass


@dataclass(frozen=True)
class Header:
    number: int
    hash: str
    parent_hash: str


def first_replay_block(stored: list[Header], current: list[Header]) -> int:
    """Return the first height whose stored canonical identity is no longer current."""
    stored_by_number = {header.number: header for header in stored}
    current_by_number = {header.number: header for header in current}
    shared = sorted(set(stored_by_number) & set(current_by_number), reverse=True)

    for number in shared:
        if stored_by_number[number].hash == current_by_number[number].hash:
            return number + 1

    raise ValueError("no common ancestor in the bounded comparison window")


if __name__ == "__main__":
    old = [
        Header(100, "0x100a", "0x099a"),
        Header(101, "0x101a", "0x100a"),
        Header(102, "0x102a", "0x101a"),
    ]
    new = [
        Header(100, "0x100a", "0x099a"),
        Header(101, "0x101a", "0x100a"),
        Header(102, "0x102b", "0x101a"),
    ]
    assert first_replay_block(old, new) == 102
    print("replay_from=102")

