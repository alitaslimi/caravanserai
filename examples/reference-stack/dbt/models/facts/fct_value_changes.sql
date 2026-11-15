{{ config(
    unique_key=['chain_id', 'block_hash', 'transaction_hash', 'log_index'],
    order_by='(chain_id, category, block_number, transaction_index, log_index)',
    partition_by='intDiv(block_number, 100000)'
) }}

select *
from {{ ref('stg_value_changed') }}
{% if is_incremental() %}
where (chain_id, block_number) in (
  select chain_id, block_number
  from {{ ref('stg_value_changed') }}
  where fetched_at >= (select coalesce(max(fetched_at), toDateTime64('1970-01-01', 3)) from {{ this }}) - interval 1 hour
)
{% endif %}

