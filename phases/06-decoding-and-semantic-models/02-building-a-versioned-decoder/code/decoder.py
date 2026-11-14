"""Dependency-free decoder for a synthetic fixed-width EVM event.

Production projects should derive topic0 from the ABI with Ethereum Keccak-256.
The all-0x11 topic below is a fixture marker, not a real signature hash.
"""

from __future__ import annotations

from dataclasses import dataclass

SYNTHETIC_TOPIC0 = "0x" + "11" * 32


def word(value: str, *, field: str) -> bytes:
    if not isinstance(value, str) or not value.startswith("0x"):
        raise TypeError(f"{field} must be a 0x-prefixed string")
    try:
        raw = bytes.fromhex(value[2:])
    except ValueError as exc:
        raise ValueError(f"{field} is not valid hexadecimal") from exc
    if len(raw) != 32:
        raise ValueError(f"{field} must be one 32-byte word, got {len(raw)} bytes")
    return raw


def indexed_address(topic: str) -> str:
    raw = word(topic, field="actor topic")
    if raw[:12] != b"\x00" * 12:
        raise ValueError("indexed address has non-zero left padding")
    return "0x" + raw[12:].hex()


def signed_int256(raw: bytes) -> int:
    if len(raw) != 32:
        raise ValueError("int256 requires 32 bytes")
    unsigned = int.from_bytes(raw, byteorder="big", signed=False)
    return unsigned - (1 << 256) if unsigned >= (1 << 255) else unsigned


@dataclass(frozen=True)
class DecodedValueChanged:
    actor_address: str
    delta_raw: int
    record_id: str


def decode_value_changed(topics: list[str], data: str) -> DecodedValueChanged:
    if len(topics) != 2:
        raise ValueError(f"ValueChanged expects 2 topics, got {len(topics)}")
    if topics[0].lower() != SYNTHETIC_TOPIC0:
        raise ValueError("unexpected event signature")
    if not data.startswith("0x"):
        raise TypeError("data must be a 0x-prefixed string")
    raw = bytes.fromhex(data[2:])
    if len(raw) != 64:
        raise ValueError(f"ValueChanged data must be 64 bytes, got {len(raw)}")
    return DecodedValueChanged(
        actor_address=indexed_address(topics[1]),
        delta_raw=signed_int256(raw[:32]),
        record_id="0x" + raw[32:].hex(),
    )


def encode_int256_fixture(value: int) -> str:
    if not -(1 << 255) <= value < (1 << 255):
        raise ValueError("value is outside int256")
    unsigned = value if value >= 0 else (1 << 256) + value
    return unsigned.to_bytes(32, "big").hex()
