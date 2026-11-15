from datetime import datetime, timezone

from airflow.sdk import Asset, dag, task

CANONICAL_LOGS = Asset("clickhouse://analytics/canonical_logs")


@dag(
    schedule=None,
    start_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    max_active_runs=1,
    params={"from_block": 100, "cutover_block": 200, "to_block": 225},
)
def history_live_cutover():
    @task
    def plan(start: int, end: int, span: int = 25) -> list[dict[str, int]]:
        return [{"start": n, "end": min(n + span, end)} for n in range(start, end, span)]

    @task(pool="rpc_requests")
    def extract(item: dict[str, int]) -> dict[str, int]:
        return item

    @task(pool="clickhouse_writers", outlets=[CANONICAL_LOGS])
    def commit(items: list[dict[str, int]], expected_start: int, expected_end: int) -> int:
        ordered = sorted(items, key=lambda item: item["start"])
        if not ordered or ordered[0]["start"] != expected_start or ordered[-1]["end"] != expected_end:
            raise ValueError("incomplete outer boundary")
        if any(left["end"] != right["start"] for left, right in zip(ordered, ordered[1:])):
            raise ValueError("gap or overlap")
        return expected_end

    planned = plan("{{ params.from_block }}", "{{ params.to_block }}")
    loaded = extract.expand(item=planned)
    commit(loaded, "{{ params.from_block }}", "{{ params.to_block }}")


history_live_cutover()

