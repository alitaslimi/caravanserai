select
  chain_id,
  toDate(block_timestamp) as day,
  category,
  sum(delta_raw) as net_delta_raw,
  count() as event_count,
  max(block_number) as cutoff_block_number,
  argMax(block_hash, tuple(block_number, transaction_index, log_index)) as cutoff_block_hash,
  max(fetched_at) as source_fetched_at
from {{ ref('fct_value_changes') }}
group by chain_id, day, category

