---
title: "Designing an RPC provider adapter"
phase: "RPC and Historical State"
phaseNumber: 2
lessonNumber: 2
type: "Build"
status: "draft"
tools: ["JSON-RPC", "Alchemy", "dRPC"]
chains: ["EVM"]
protocols: []
datasets: ["blocks", "receipts", "logs", "traces", "state calls"]
time: "40 minutes"
---

# Designing an RPC provider adapter

## Why It Matters

Ethereum JSON-RPC standardizes method shapes, not every provider's historical coverage, trace namespace, batch behavior, or operational limits. An analytics pipeline should depend on a small capability contract rather than scatter provider assumptions through extraction code.

## Outcomes

- Separate standard RPC methods from provider-specific capabilities.
- Validate every JSON-RPC item in a successful HTTP response.
- Pin historical reads to a block number and record block identity.
- Change providers without changing normalized warehouse fields.

## Capability matrix

Probe capabilities with small public requests before a backfill. Record the provider, chain, method, earliest successful block, response shape, error code, latency, and retrieval date.

| Capability | Typical methods | Check independently |
| --- | --- | --- |
| Canonical blocks | `eth_getBlockByNumber` | Finality tag support and reorg handling |
| Receipts | `eth_getTransactionReceipt` | Historical depth and batch limits |
| Logs | `eth_getLogs` | Maximum block span and result limits |
| Historical state | `eth_call` with block tag | Archive availability per chain |
| Transaction traces | `debug_traceTransaction`, `trace_transaction`, or provider method | Namespace, tracer configuration, and historical coverage |
| Batch requests | JSON array of calls | Per-item errors, ordering, and maximum batch size |

Alchemy and dRPC can both serve core EVM JSON-RPC, but the adapter should discover and configure non-standard trace behavior explicitly. Do not infer trace or archive support from a successful `eth_blockNumber` call.

Alchemy's batch documentation explicitly notes that responses can arrive out of order and that some enhanced, trace, and debug APIs do not support batching. dRPC documents trace/debug availability separately from core methods and by plan. Treat both as runtime capability inputs rather than hard-coded universal support.

## Normalized boundary

Keep provider payloads in a raw capture when practical, then map them into neutral fields:

| Normalized field | Source concept |
| --- | --- |
| `chain_id` | Configured network identity |
| `block_number` | Hex quantity converted to unsigned integer |
| `block_hash` | Canonical block identity |
| `transaction_hash` | Transaction identity |
| `transaction_index` | Position within the block |
| `log_index` | Position within the transaction receipt |
| `contract_address` | Log emitter or call destination |
| `block_timestamp` | UTC timestamp from the containing block |
| `_source` | Provider and API family, without credentials |
| `_fetched_at` | Retrieval time, not event time |

Never use list position as a batch response key. JSON-RPC responses may arrive out of order; match each response to its request by `id`.

## Retry contract

Retry only errors classified as transient, such as throttling, gateway failure, or a bounded timeout. Permanent errors—unknown method, invalid parameters, unsupported historical state—should fail with the method, chain, and block scope. Keep the retry budget inside the Airflow task timeout.

```flow
{
  "caption": "Provider-neutral request handling.",
  "steps": [
    "Build requests with stable IDs",
    "Send a bounded batch",
    "Validate HTTP and JSON",
    "Match every response by ID",
    "Retry transient item errors",
    "Normalize and persist provenance"
  ]
}
```

## Lab

Use the dependency-free client in `code/rpc_client.py` with an `RPC_URL` environment variable. Request two public blocks, reorder the fixture responses, and verify that results still map correctly by ID. Add one JSON-RPC throttling error inside an HTTP 200 response and confirm that the batch is not reported as fully successful.

## Checks

- Does every historical state value record its block number and hash?
- Can a provider-specific trace result be mapped without changing downstream field names?
- Are secrets excluded from logs and saved fixtures?
- Does an unsupported capability fail differently from a transient request error?

## Next Steps

Compare the same bounded block range with an indexed extraction service, then reconcile normalized keys rather than raw payload shapes.

## Public References

- [Alchemy: batch requests](https://www.alchemy.com/docs/reference/batch-requests)
- [Alchemy: reading data with JSON-RPC](https://www.alchemy.com/docs/how-to-read-data-with-json-rpc)
- [dRPC: Ethereum debug and trace methods](https://drpc.org/docs/ethereum-api/debugandtrace)
- [dRPC: plan capability matrix](https://drpc.org/docs/pricing/plans)
