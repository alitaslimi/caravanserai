select
  r.chain_id,
  r.market_id,
  greatest(r.deployment_block, coalesce(p.verified_through_block + 1 - {overlap:UInt64}, r.deployment_block)) as from_block,
  {source_tip:UInt64} + 1 as to_block
from lending_market_registry r
left join market_progress p using (chain_id, market_id)
where r.deployment_block <= {source_tip:UInt64};
