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
