select
  chain_id,
  block_number,
  block_hash,
  transaction_hash,
  transaction_index,
  log_index,
  lower(emitter_address) as emitter_address,
  lower(actor_address) as actor_address,
  category,
  delta_raw,
  new_value_raw,
  block_timestamp,
  source,
  fetched_at
from {{ source('chain', 'raw_logs') }}
where emitter_address = '0x1111111111111111111111111111111111111111'

