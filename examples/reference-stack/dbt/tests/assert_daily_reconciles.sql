with detail as (
  select chain_id, toDate(block_timestamp) as day, sum(delta_raw) as expected
  from {{ ref('fct_value_changes') }}
  group by chain_id, day
), published as (
  select chain_id, day, sum(net_delta_raw) as actual
  from {{ ref('daily_value_changes') }}
  group by chain_id, day
)
select *
from detail
full outer join published using (chain_id, day)
where expected != actual or expected is null or actual is null

