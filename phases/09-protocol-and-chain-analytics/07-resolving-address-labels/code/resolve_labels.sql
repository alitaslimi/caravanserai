select * except (winner_rank)
from (
  select chain_id, address, namespace, value, source, valid_from, valid_to,
         row_number() over (
           partition by chain_id, address, namespace
           order by source_priority asc, valid_from desc, source, value
         ) as winner_rank
  from label_assertions
  where valid_from <= {effective_at:DateTime64(3)}
    and (valid_to is null or valid_to > {effective_at:DateTime64(3)})
)
where winner_rank = 1;
