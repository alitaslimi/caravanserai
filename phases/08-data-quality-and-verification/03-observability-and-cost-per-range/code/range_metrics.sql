select
  chain_id,
  pipeline_revision,
  countIf(status = 'committed') as committed_ranges,
  sum(to_block - from_block) as attempted_blocks,
  sumIf(to_block - from_block, status = 'committed') as committed_blocks,
  sum(source_requests) as source_requests,
  source_requests / nullIf(committed_blocks, 0) as requests_per_committed_block,
  sum(read_bytes) / nullIf(sum(output_rows), 0) as bytes_read_per_output_row,
  quantileExact(0.95)(duration_ms) as range_duration_p95_ms,
  max(committed_at) as last_commit_at
from pipeline_range_metrics
group by chain_id, pipeline_revision;

