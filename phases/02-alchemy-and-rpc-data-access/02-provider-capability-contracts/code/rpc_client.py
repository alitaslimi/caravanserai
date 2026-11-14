"""Small provider-neutral JSON-RPC batch client using the Python standard library.

Set RPC_URL at runtime. Never commit an endpoint containing a credential.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


class RpcTransportError(RuntimeError):
    """The HTTP request or response envelope was unusable."""


@dataclass(frozen=True)
class RpcItemError:
    request_id: int
    code: int | None
    message: str


@dataclass(frozen=True)
class RpcBatchResult:
    values: dict[int, Any]
    errors: tuple[RpcItemError, ...]


def request(method: str, params: list[Any], request_id: int) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": params,
    }


def parse_batch(payload: Any, expected_ids: set[int]) -> RpcBatchResult:
    if not isinstance(payload, list):
        raise RpcTransportError("batch response must be a JSON array")

    values: dict[int, Any] = {}
    errors: list[RpcItemError] = []
    seen: set[int] = set()

    for item in payload:
        if not isinstance(item, dict) or not isinstance(item.get("id"), int):
            raise RpcTransportError("every response item must contain an integer id")
        request_id = item["id"]
        if request_id not in expected_ids or request_id in seen:
            raise RpcTransportError(f"unexpected or duplicate response id: {request_id}")
        seen.add(request_id)

        if "error" in item:
            error = item["error"] if isinstance(item["error"], dict) else {}
            errors.append(
                RpcItemError(
                    request_id=request_id,
                    code=error.get("code") if isinstance(error.get("code"), int) else None,
                    message=str(error.get("message") or "unknown JSON-RPC error"),
                )
            )
        elif "result" in item:
            values[request_id] = item["result"]
        else:
            raise RpcTransportError(f"response {request_id} has neither result nor error")

    missing = expected_ids - seen
    if missing:
        raise RpcTransportError(f"missing response ids: {sorted(missing)}")
    return RpcBatchResult(values=values, errors=tuple(errors))


def post_batch(calls: list[dict[str, Any]], timeout_seconds: float = 30) -> RpcBatchResult:
    rpc_url = os.environ.get("RPC_URL")
    if not rpc_url:
        raise RuntimeError("RPC_URL is required")

    ids = {call["id"] for call in calls}
    if len(ids) != len(calls):
        raise ValueError("request IDs must be unique")

    http_request = urllib.request.Request(
        rpc_url,
        data=json.dumps(calls).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "onchain-lab/1"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(http_request, timeout=timeout_seconds) as response:
            payload = json.load(response)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RpcTransportError(f"RPC transport failed: {exc}") from exc

    return parse_batch(payload, ids)


if __name__ == "__main__":
    calls = [
        request("eth_getBlockByNumber", ["latest", False], 1),
        request("eth_chainId", [], 2),
    ]
    result = post_batch(calls)
    print(json.dumps({"successful_ids": sorted(result.values), "errors": len(result.errors)}))
