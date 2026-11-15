create database if not exists analytics;

create table if not exists analytics.raw_logs (
  chain_id UInt64,
  block_number UInt64,
  block_hash FixedString(66),
  transaction_hash FixedString(66),
  transaction_index UInt32,
  log_index UInt32,
  emitter_address FixedString(42),
  topic0 FixedString(66),
  actor_address FixedString(42),
  category LowCardinality(String),
  delta_raw Int256,
  new_value_raw UInt256,
  block_timestamp DateTime64(3, 'UTC'),
  source LowCardinality(String),
  fetched_at DateTime64(3, 'UTC')
)
engine = MergeTree
partition by intDiv(block_number, 100000)
order by (chain_id, emitter_address, block_number, transaction_index, log_index);

create table if not exists analytics.range_manifests (
  run_id UUID,
  chain_id UInt64,
  from_block UInt64,
  to_block UInt64,
  status LowCardinality(String),
  row_count UInt64,
  payload_checksum FixedString(64),
  pipeline_revision String,
  committed_at Nullable(DateTime64(3, 'UTC'))
)
engine = MergeTree
order by (chain_id, from_block, to_block, run_id);

