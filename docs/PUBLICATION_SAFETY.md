# Publication safety

Caravanserai publishes reusable engineering knowledge, not an organization's operating history. Lessons may explain a failure mode, measurement method, or tool behavior, but they must not reveal private infrastructure, business logic, access patterns, or incident details.

## Safe source material

Prefer, in order:

1. Synthetic fixtures created for the lesson.
2. Public-chain records that any reader can retrieve independently.
3. Public vendor documentation and published API behavior.
4. A generalized pattern derived from private experience, with identifying details removed.

Vendor and framework names such as Ethereum JSON-RPC, Alchemy, dRPC, Envio HyperSync, Airflow, dbt, and ClickHouse are useful when behavior depends on the tool. Name the public capability being exercised, not a private account, endpoint, plan, deployment, or observed customer limit.

## Do not publish

- Organization, client, employee, repository, dashboard, channel, account, role, host, database, bucket, or schema identifiers.
- Private RPC URLs, API keys, credentials, IP addresses, cloud regions, machine sizes, or security rules.
- Exact production row counts, failure rates, schedules, costs, query volumes, incident dates, or recovery windows.
- Proprietary protocol mappings, commercial metrics, unpublished addresses, or private label data.
- SQL, configuration, or screenshots copied from a private production system.
- A sequence of otherwise harmless details that reconstructs a private incident.

## Generalize without weakening the lesson

Keep the mechanism and verification method. Replace identifying context:

| Private source detail | Publishable replacement |
| --- | --- |
| Exact production count | Small synthetic count or qualitative statement |
| Internal schema or model | `raw.logs`, `staging.events`, or `mart.facts` |
| Named protocol defect | A synthetic emitter, market, bridge, or token |
| Private endpoint | `RPC_URL` or `HYPERSYNC_URL` |
| Incident date and duration | “During a bounded replay” |
| Internal user or service account | `developer`, `scheduler`, or `read_only` |
| Company-specific threshold | A clearly labelled example threshold |

Do not merely rename a private system while preserving its distinctive values and chronology. Rebuild the example as a minimal fixture that demonstrates the same invariant.

## Evidence labels

Label evidence in prose and figures:

- **Synthetic example:** designed to demonstrate a mechanism.
- **Public-chain example:** includes chain, block range, retrieval method, and retrieval date.
- **Vendor-documented behavior:** links to the public documentation when citations are added.
- **Measured locally:** includes the tool version and settings but no private environment details.

Private observations can motivate a lesson, but the published claim should be reproducible from one of these evidence classes.

## Pre-publication check

Before publishing a lesson:

1. Search for organization, repository, person, host, schema, and dashboard names.
2. Check code, comments, fixtures, output files, image metadata, and Git diffs—not only prose.
3. Replace production measurements with synthetic fixtures unless the values come from a cited public dataset.
4. Verify that example environment variables contain placeholders only.
5. Confirm that a reader can understand the invariant without the private backstory.
6. Ask whether combining the lesson with adjacent lessons reveals a private architecture. Generalize further if it does.
