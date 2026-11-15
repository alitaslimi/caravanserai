# Runnable onchain analytics reference stack

This local stack demonstrates the complete educational path with synthetic EVM records:

1. ClickHouse stores canonical logs and range manifests.
2. dbt normalizes, incrementally decodes, tests, and publishes a daily metric.
3. Airflow plans bounded ranges and runs the transform and quality boundary.

No public RPC account is required. The fixture uses synthetic addresses, hashes, and payloads. It is a learning environment, not a production deployment.

## Requirements

- Docker Engine with Compose v2
- At least 6 GB of memory available to Docker when the optional Airflow profile is enabled

## Start ClickHouse and run dbt

```bash
docker compose up -d clickhouse
docker compose run --rm dbt deps
docker compose run --rm dbt seed
docker compose run --rm dbt build
```

The ClickHouse HTTP interface is available at `http://127.0.0.1:8123`. The example credentials are intentionally local and non-secret.

Inspect the published metric:

```bash
curl "http://127.0.0.1:8123/?database=analytics&query=select%20*%20from%20daily_value_changes%20format%20PrettyCompact"
```

## Start the optional Airflow lab

```bash
docker compose --profile orchestration up -d airflow
```

Open `http://127.0.0.1:8080`. Airflow standalone prints its generated local credentials to the container log:

```bash
docker compose logs airflow
```

The DAG is paused by default. Before running it, create the educational pools described in `airflow/POOLS.md` and unpause `synthetic_onchain_pipeline`.

## Inject and repair a duplicate

Insert the fixture range a second time:

```bash
docker compose exec clickhouse clickhouse-client --database analytics --query "insert into raw_logs select * from raw_logs"
docker compose run --rm dbt build
```

The canonical uniqueness test should fail. Repair the bounded fixture range with `scripts/repair_fixture.sql`, rerun dbt, and preserve the failing and passing output as capstone evidence.

## Environment isolation

`profiles.yml` reads host, database, user, and password from environment variables. Production credentials do not belong in this repository. Use distinct ClickHouse users and databases for development, CI, and production; naming alone is not a permission boundary.

## Version notes

The stack pins ClickHouse LTS, Airflow, and dbt-clickhouse versions so a lab run is reproducible. Upgrade them deliberately and run `docker compose config`, `dbt parse`, and the full dbt build before changing the pins.

