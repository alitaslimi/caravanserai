from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from airflow.sdk import dag, task

DBT_DIR = Path("/opt/airflow/dbt")


@dag(
    dag_id="synthetic_onchain_pipeline",
    schedule="0 2 * * *",
    start_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    max_active_runs=1,
    default_args={"retries": 2, "retry_delay": timedelta(minutes=2)},
    params={"from_block": 100000, "to_block": 100100, "expected_revision": "reference-stack-v1"},
    tags=["education", "synthetic", "onchain"],
)
def synthetic_onchain_pipeline():
    @task
    def validate_revision(expected_revision: str) -> str:
        actual = os.environ.get("PIPELINE_REVISION")
        if actual != expected_revision:
            raise ValueError(f"revision mismatch: expected {expected_revision}, got {actual}")
        return actual

    @task(pool="rpc_requests")
    def plan_ranges(from_block: int, to_block: int, span: int = 25) -> list[dict[str, int]]:
        if from_block >= to_block:
            raise ValueError("expected a non-empty half-open range")
        return [
            {"from_block": start, "to_block": min(start + span, to_block)}
            for start in range(from_block, to_block, span)
        ]

    @task(pool="rpc_requests")
    def extract_range(block_range: dict[str, int]) -> dict[str, int | str]:
        # Replace this fixture result with a provider adapter. The task contract stays neutral.
        return {**block_range, "status": "fixture_available", "row_count": 0}

    @task(pool="clickhouse_writers")
    def commit_contiguous_ranges(results: list[dict[str, int | str]]) -> int:
        ordered = sorted(results, key=lambda item: int(item["from_block"]))
        for left, right in zip(ordered, ordered[1:]):
            if left["to_block"] != right["from_block"]:
                raise ValueError("range gap or overlap")
        return int(ordered[-1]["to_block"])

    @task
    def run_dbt_build(committed_end: int) -> int:
        import subprocess

        subprocess.run(
            ["dbt", "build", "--project-dir", str(DBT_DIR), "--profiles-dir", str(DBT_DIR)],
            check=True,
            timeout=900,
        )
        return committed_end

    revision = validate_revision("{{ params.expected_revision }}")
    ranges = plan_ranges("{{ params.from_block }}", "{{ params.to_block }}")
    extracted = extract_range.expand(block_range=ranges)
    committed = commit_contiguous_ranges(extracted)
    built = run_dbt_build(committed)
    revision >> ranges
    built


synthetic_onchain_pipeline()

