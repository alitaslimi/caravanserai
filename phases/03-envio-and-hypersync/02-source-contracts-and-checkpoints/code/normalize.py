"""Synthetic normalization helpers for RPC- and Arrow-style EVM fields."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


def hex_bytes(value: bytes | str, *, size: int, field: str) -> str:
    if isinstance(value, bytes):
        raw = value
    elif isinstance(value, str) and value.startswith("0x"):
        try:
            raw = bytes.fromhex(value[2:])
        except ValueError as exc:
            raise ValueError(f"{field} is not valid hexadecimal") from exc
    else:
        raise TypeError(f"{field} must be bytes or a 0x-prefixed string")
    if len(raw) != size:
        raise ValueError(f"{field} must be {size} bytes, got {len(raw)}")
    return "0x" + raw.hex()


def quantity(value: int | str, *, field: str) -> int:
    if isinstance(value, int):
        result = value
    elif isinstance(value, str) and value.startswith("0x"):
        result = int(value, 16)
    else:
        raise TypeError(f"{field} must be an integer or hex quantity")
    if result < 0:
        raise ValueError(f"{field} cannot be negative")
    return result


@dataclass(frozen=True)
class NormalizedLog:
    chain_id: int
    block_number: int
    transaction_index: int
    log_index: int
    transaction_hash: str
    contract_address: str
    topic0: str
    data: str
    block_timestamp: datetime

    @property
    def key(self) -> tuple[int, int, int, int]:
        return self.chain_id, self.block_number, self.transaction_index, self.log_index


def normalize_log(raw: dict, *, chain_id: int, block_timestamp: int) -> NormalizedLog:
    return NormalizedLog(
        chain_id=chain_id,
        block_number=quantity(raw["block_number"], field="block_number"),
        transaction_index=quantity(raw["transaction_index"], field="transaction_index"),
        log_index=quantity(raw["log_index"], field="log_index"),
        transaction_hash=hex_bytes(raw["transaction_hash"], size=32, field="transaction_hash"),
        contract_address=hex_bytes(raw["address"], size=20, field="address").lower(),
        topic0=hex_bytes(raw["topic0"], size=32, field="topic0"),
        data=hex_bytes(raw["data"], size=len(raw["data"]) if isinstance(raw["data"], bytes) else len(raw["data"][2:]) // 2, field="data"),
        block_timestamp=datetime.fromtimestamp(block_timestamp, tz=UTC),
    )


if __name__ == "__main__":
    synthetic = {
        "block_number": "0x64",
        "transaction_index": 2,
        "log_index": "0x1",
        "transaction_hash": bytes.fromhex("22" * 32),
        "address": "0x" + "aa" * 20,
        "topic0": bytes.fromhex("11" * 32),
        "data": b"",
    }
    print(normalize_log(synthetic, chain_id=1, block_timestamp=1_700_000_000))
