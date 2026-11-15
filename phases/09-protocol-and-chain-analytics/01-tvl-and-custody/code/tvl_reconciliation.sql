with custody as (
  select token_address, sum(raw_balance) as custody_raw
  from synthetic_balances
  where block_number = {cutoff:UInt64}
  group by token_address
), attribution as (
  select token_address,
         sumIf(raw_balance, pool_id is not null) as attributed_raw,
         sumIf(raw_balance, pool_id is null) as unattributed_raw
  from synthetic_pool_attribution
  where block_number = {cutoff:UInt64}
  group by token_address
)
select c.token_address, c.custody_raw, a.attributed_raw, a.unattributed_raw,
       c.custody_raw = a.attributed_raw + a.unattributed_raw as reconciles
from custody c
left join attribution a using (token_address);
