-- Synthetic EVM log table for local experiments.
create table if not exists lab.evm_logs
(
    chain_id UInt64,
    block_number UInt64,
    block_hash FixedString(32),
    block_timestamp DateTime64(3, 'UTC'),
    transaction_hash FixedString(32),
    transaction_index UInt32,
    log_index UInt32,
    contract_address FixedString(20),
    topic0 FixedString(32),
    topics Array(FixedString(32)),
    data String,
    _source LowCardinality(String),
    _fetched_at DateTime64(3, 'UTC') default now64(3)
)
engine = MergeTree
partition by (chain_id, toYYYYMM(block_timestamp))
order by (chain_id, block_number, transaction_index, log_index);

-- Run on a bounded range. MergeTree does not enforce this key.
select
    count() as physical_rows,
    uniqExact(tuple(chain_id, block_number, transaction_index, log_index)) as logical_keys,
    physical_rows - logical_keys as duplicate_key_excess
from lab.evm_logs
where chain_id = 1
  and block_number >= 100
  and block_number < 200;

-- Metadata first for large-table health checks.
select
    database,
    table,
    partition,
    count() as active_parts,
    sum(rows) as rows,
    formatReadableSize(sum(bytes_on_disk)) as bytes_on_disk
from system.parts
where active
  and database = 'lab'
  and table = 'evm_logs'
group by database, table, partition
order by partition;

-- Use SETTINGS use_query_condition_cache = 0 for predicate comparisons.
select count()
from lab.evm_logs
prewhere chain_id = 1 and block_number >= 100 and block_number < 200
where topic0 = reinterpretAsFixedString(unhex(repeat('11', 32)))
settings use_query_condition_cache = 0;
