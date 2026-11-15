# Glossary

### block

A batch of transactions accepted by a blockchain at a specific height and time.

### transaction

A signed request that changes chain state or attempts to call a contract.

### event log

Structured data emitted by a smart contract during execution and stored in the transaction receipt.

### trace

A record of internal calls made while a transaction executes, often needed to understand contract-to-contract behavior.

### ABI

The Application Binary Interface that describes how to encode contract calls and decode events.

### contract address

The chain-specific address where a deployed smart contract can be called and inspected.

### token transfer

An asset movement, usually decoded from standard events such as ERC-20 `Transfer`.

### TVL

Total value locked, a metric estimating the market value of assets deposited in a protocol.

### dbt model

A SQL transformation managed by dbt, usually materialized as a view, table, or incremental table.

### fact table

A table of events or measurements at a clear grain, such as one row per transfer.

### dimension table

A descriptive table used to enrich facts, such as token metadata or protocol labels.

### incremental model

A model that updates only new or changed records instead of rebuilding the full table every run.

### natural key

The smallest set of domain fields that identifies one logical record, independent of warehouse storage behavior.

### canonical block

The block currently accepted at a chain height under a stated finality policy. A different block hash may previously have been observed at the same height.

### reorganization

A change to the accepted chain history that replaces one or more recent blocks with a different branch.

### finality policy

The rule a pipeline uses to decide which observed blocks are stable enough to publish, such as a finalized tag or a configured confirmation depth.

### half-open range

An interval that includes its start and excludes its end, written `[start, end)`, so adjacent ranges compose without overlap.

### checkpoint

A durable record of contiguous completed work, including enough source identity to validate a restart.

### watermark

A boundary used by an incremental process to select new or changed source records. It is a processing mechanism, not necessarily a completeness guarantee.

### idempotency

The property that repeating an operation with the same logical input leaves the same logical result.

### ABI era

A historical interval during which a particular ABI and decoder revision apply to a contract deployment.

### backpressure

Flow control that slows producers when downstream queues, decoders, or writers approach their configured capacity.

### data cutoff

The latest block or event-time boundary included in a result, recorded separately from the time the result was generated.

### coverage

The declared portion of a source population that was requested, successfully collected, validated, and included in an output.
