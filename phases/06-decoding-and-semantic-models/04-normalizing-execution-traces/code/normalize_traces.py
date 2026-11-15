from __future__ import annotations

from typing import Any


def flatten_call_tree(root: dict[str, Any]) -> list[dict[str, Any]]:
    frames: list[dict[str, Any]] = []

    def visit(frame: dict[str, Any], path: tuple[int, ...]) -> None:
        frames.append({
            "trace_address": path,
            "parent_trace_address": path[:-1] if path else None,
            "call_type": frame.get("type", "CALL").upper(),
            "from_address": frame.get("from"),
            "to_address": frame.get("to"),
            "value_raw": int(frame.get("value", "0x0"), 16),
            "error": frame.get("error"),
        })
        for index, child in enumerate(frame.get("calls", [])):
            visit(child, path + (index,))

    visit(root, ())
    return frames


if __name__ == "__main__":
    fixture = {"type": "CALL", "from": "0x01", "to": "0x02", "value": "0x0", "calls": [
        {"type": "CALL", "from": "0x02", "to": "0x03", "value": "0x2a"},
        {"type": "DELEGATECALL", "from": "0x02", "to": "0x04", "value": "0x0", "error": "execution reverted"},
    ]}
    rows = flatten_call_tree(fixture)
    assert [row["trace_address"] for row in rows] == [(), (0,), (1,)]
    assert rows[1]["value_raw"] == 42
    assert rows[2]["error"] == "execution reverted"
    print("trace normalization passed")

