from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class LogKey:
    chain_id: int
    block_hash: str
    transaction_hash: str
    log_index: int


def reconcile(left: set[LogKey], right: set[LogKey]) -> dict[str, set[LogKey]]:
    return {
        "shared": left & right,
        "left_only": left - right,
        "right_only": right - left,
    }


def assert_unique(keys: list[LogKey]) -> None:
    if len(keys) != len(set(keys)):
        raise ValueError("duplicate canonical log key")


if __name__ == "__main__":
    key = LogKey(1, "0xblock", "0xtx", 0)
    assert reconcile({key}, {key})["shared"] == {key}
    try:
        assert_unique([key, key])
    except ValueError:
        print("duplicate injection detected")

