-- Educational bounded repair. Validate the target range before executing.
alter table analytics.raw_logs
delete where chain_id = 1 and block_number >= 100000 and block_number < 100100;

-- Reload clickhouse/init/02_fixture.sql, then run dbt build --full-refresh for this tiny fixture.
