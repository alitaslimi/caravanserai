select
  coalesce(s.bridge_namespace, r.bridge_namespace) as bridge_namespace,
  coalesce(s.transfer_id, r.transfer_id) as transfer_id,
  s.source_chain_id, r.destination_chain_id,
  s.raw_amount as sent_raw, r.raw_amount as received_raw,
  multiIf(s.transfer_id is null, 'receive_only', r.transfer_id is null, 'send_only', 'matched') as status
from bridge_sends s
full outer join bridge_receives r
  on s.bridge_namespace = r.bridge_namespace
 and s.transfer_id = r.transfer_id;
