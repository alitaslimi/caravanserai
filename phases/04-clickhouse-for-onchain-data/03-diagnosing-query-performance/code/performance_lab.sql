-- Replace the bounds with a small synthetic interval available in your fixture.
explain indexes = 1
select count()
from canonical_logs
where topic0 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

explain indexes = 1
select count()
from canonical_logs
where chain_id = 1
  and emitter_address = '0x1111111111111111111111111111111111111111'
  and block_number >= 100000
  and block_number < 110000
  and topic0 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

select
    normalized_query_hash,
    read_rows,
    read_bytes,
    memory_usage,
    query_duration_ms,
    result_rows
from system.query_log
where type = 'QueryFinish'
  and event_time >= now() - interval 10 minute
order by event_time desc
limit 20;

