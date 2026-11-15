create table block_observations (
    chain_id UInt64,
    block_number UInt64,
    block_hash FixedString(66),
    parent_hash FixedString(66),
    block_timestamp DateTime64(3, 'UTC'),
    source LowCardinality(String),
    fetched_at DateTime64(3, 'UTC')
)
engine = MergeTree
order by (chain_id, block_number, block_hash, fetched_at);

create table canonical_block_selection (
    chain_id UInt64,
    block_number UInt64,
    block_hash FixedString(66),
    selected_at DateTime64(3, 'UTC')
)
engine = ReplacingMergeTree(selected_at)
order by (chain_id, block_number);

create table canonical_logs (
    chain_id UInt64,
    block_number UInt64,
    block_hash FixedString(66),
    transaction_hash FixedString(66),
    transaction_index UInt32,
    log_index UInt32,
    emitter_address FixedString(42),
    topic0 Nullable(FixedString(66)),
    topics Array(FixedString(66)),
    data String,
    source LowCardinality(String),
    fetched_at DateTime64(3, 'UTC')
)
engine = MergeTree
partition by intDiv(block_number, 1000000)
order by (chain_id, emitter_address, block_number, log_index);

create view current_canonical_logs as
select l.*
from canonical_logs l
inner join
(
    select
        chain_id,
        block_number,
        argMax(block_hash, selected_at) as block_hash
    from canonical_block_selection
    group by chain_id, block_number
) s using (chain_id, block_number, block_hash);

