# Educational Airflow pools

Create these pools before enabling the DAG:

```bash
airflow pools set rpc_requests 2 "Bound concurrent source requests"
airflow pools set clickhouse_writers 1 "Keep fixture writes and repair mutually exclusive"
```

Production slot counts must be derived from provider agreements, destination capacity, and measured task behavior. Do not copy these educational values blindly.

