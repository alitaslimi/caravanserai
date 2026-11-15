select * except (rank)
from (
  select chain_id, token_address, hour, price, source, observed_at,
         row_number() over (
           partition by chain_id, token_address, hour
           order by is_valid desc, source_priority asc, observed_at desc, source
         ) as rank
  from price_candidates
  where observed_at <= hour + interval 1 hour
)
where rank = 1;
