"""Generic Airflow 3 DAG skeleton for a bounded onchain range.

The task bodies are deliberately small placeholders. Replace them with tested
modules; keep secrets and network calls inside task execution, never at import.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from airflow.sdk import dag, task


@dag(
    dag_id="example_onchain_range",
    schedule="15 * * * *",
    start_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    max_active_runs=1,
    dagrun_timeout=timedelta(hours=2),
    tags=["example", "onchain", "hourly"],
)
def onchain_range():
    @task(execution_timeout=timedelta(minutes=2), retries=0)
    def plan_range() -> dict:
        # Read runtime configuration and remote height here. Return only a small
        # JSON-serializable control-plane plan.
        return {
            "chain_id": 1,
            "from_block": 100,
            "to_block": 120,
            "schema_version": 1,
        }

    @task(
        execution_timeout=timedelta(minutes=30),
        retries=2,
        retry_delay=timedelta(minutes=2),
        pool="rpc_requests",
        pool_slots=1,
    )
    def fetch_logs(plan: dict) -> str:
        # Write a run-scoped object and return its durable object key, not rows.
        assert plan["from_block"] < plan["to_block"]
        return f"example/{plan['chain_id']}/{plan['from_block']}-{plan['to_block']}/logs.jsonl"

    @task(
        execution_timeout=timedelta(minutes=30),
        retries=1,
        retry_delay=timedelta(minutes=2),
        pool="clickhouse_writes",
        pool_slots=2,
    )
    def load_range(plan: dict, object_key: str) -> dict:
        # Use a deterministic batch key or replacement operation so a retry
        # converges. Raise if a partial batch cannot be proven complete.
        return {"object_key": object_key, "rows_written": 10, "plan": plan}

    @task(execution_timeout=timedelta(minutes=10), retries=0, pool="clickhouse_reads")
    def audit_range(load_result: dict) -> dict:
        # Check interval bounds, natural-key duplicates, and expected coverage.
        if load_result["rows_written"] <= 0:
            raise RuntimeError("bounded audit expected at least one synthetic row")
        return {"status": "passed", "rows": load_result["rows_written"]}

    @task(execution_timeout=timedelta(minutes=2), retries=0)
    def commit_range(plan: dict, audit: dict) -> None:
        # The durable completed-range marker is the last side effect.
        if audit["status"] != "passed":
            raise RuntimeError("cannot commit an unaudited range")
        print(
            f"[complete] chain={plan['chain_id']} range=[{plan['from_block']},{plan['to_block']}) "
            f"rows={audit['rows']}"
        )

    plan = plan_range()
    object_key = fetch_logs(plan)
    loaded = load_range(plan, object_key)
    audited = audit_range(loaded)
    commit_range(plan, audited)


onchain_range()
