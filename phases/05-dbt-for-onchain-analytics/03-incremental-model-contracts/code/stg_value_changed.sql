{#
  Grain: one ValueChanged event per chain, block, transaction, and log position.
  Repair bounds are half-open. This synthetic example assumes immutable event
  payloads and anti-joins existing keys in the repeated window.
#}

{{ config(
    materialized='incremental',
    incremental_strategy='append',
    engine='MergeTree()',
    order_by='(chain_id, block_number, transaction_index, log_index)'
) }}

{% set repair_start = var('repair_start_block', none) %}
{% set repair_end = var('repair_end_block', none) %}

with source_events as (
    select
        chain_id,
        block_timestamp,
        block_number,
        transaction_hash,
        transaction_index,
        log_index,
        contract_address,
        actor_address,
        record_id,
        delta_raw
    from {{ ref('decoded_value_changed') }}
    where 1 = 1
    {% if repair_start is not none %}
      and block_number >= {{ repair_start }}
      and block_number < {{ repair_end }}
    {% elif is_incremental() %}
      and block_number >= greatest(
          (select coalesce(max(block_number), 0) from {{ this }}) - {{ var('lookback_blocks', 1000) }},
          0
      )
    {% endif %}
),

new_keys as (
    select s.*
    from source_events as s
    {% if is_incremental() %}
    left anti join {{ this }} as t
        on s.chain_id = t.chain_id
        and s.block_number = t.block_number
        and s.transaction_index = t.transaction_index
        and s.log_index = t.log_index
    {% endif %}
)

select
    chain_id as chain_id,
    block_timestamp as block_timestamp,
    block_number as block_number,
    transaction_hash as transaction_hash,
    transaction_index as transaction_index,
    log_index as log_index,
    contract_address as contract_address,
    actor_address as actor_address,
    record_id as record_id,
    delta_raw as delta_raw
from new_keys
