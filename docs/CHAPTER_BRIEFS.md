# Chapter briefs

Build the first route around a single bounded EVM dataset. Keep the block range, source, extraction time, natural keys, and expected outputs with the fixture. Reuse it for decoding, modeling, reconciliation, and recovery. Add protocol-specific datasets when a lesson needs historical state, multiple deployments, or a different grain.

## 00 Orientation & Local Tooling

**Lab.** Run a read-only query from a fresh environment. Record the executable, effective configuration, database, and code revision. Run a scratch write only after checking the resolved destination.

**Field notes.** A repo-local profile can shadow a user profile. A custom schema rule can point a dev run at a shared table despite a dev target name. Diagnose TLS, authentication, and server-side query errors independently. Use a fresh compiled artifact and an explicit file diff when testing a change from a shared checkout. Put Windows shell, CRLF, and subprocess details in a troubleshooting note.

## 01 Blockchains as Data

**Lab.** Follow a transaction through its block, receipt, logs, and internal calls. Write the key and ordering contract for each table. Compare field presence by transaction type and chain era.

**Field notes.** A field declared by a provider may be empty, populated only for one transaction type, or historically meaningless in one chain era. Audit coverage by block first, then use receipts and transaction status to classify exceptions. Values clustered near an integer boundary provide a testable hypothesis about signed decoding; demonstrate this with a synthetic fixture.

## 02 RPC and Historical State

**Lab.** Resolve an hourly cutoff to the last eligible block. Pin the block for contract reads and compare supply or balance results to an independently reconstructed series. Record the chain, block, method, and response.

**Field notes.** Alchemy, dRPC, and other RPC providers can expose different historical-state, trace, receipt, and batch capabilities by chain and plan. Teach readers to probe those capabilities separately and report gaps where a network or era lacks coverage.

## 03 Bulk Extraction and Ingestion

**Lab.** Extract the same range via JSON-RPC and an indexed API. Select fields explicitly, inspect actual returned types, normalize them, load in batches, and resume after interrupting the run.

**Field notes.** The HyperSync implementation encountered Arrow binary values, hex output modes, stale client schemas, and block timestamp enrichment. Keep a source-to-target field matrix and a durable ledger of completed ranges. Measure the full load as well as extraction throughput. Probe schema differences across multiple chains and historical windows.

## 04 Warehousing Onchain Data

**Lab.** Choose keys for a bounded block scan and a common analyst query. Replay a batch and compare physical rows, distinct logical keys, and conflicting payloads. Demonstrate the effect of the sort key on rows and bytes read.

**Field notes.** ClickHouse examples include eventual ReplacingMergeTree deduplication, insert-triggered materialized views, and pruning lost when a literal bound becomes a join-derived bound. Test integer scaling at extreme decimals, missing join rows, type widening, alias shadowing, and UTC serialization with small adversarial fixtures. Record engine and settings when explaining the result.

## 05 Transformation and Incremental Modeling

**Lab.** Build a staging model, a conformed intermediate, and a published fact. Simulate a quiet market, a new token, a late correction, and a historical source replay. Verify the result against a bounded full recomputation.

**Field notes.** Match the watermark key to the stream that can advance or be added independently. Model-head and source-tip lookbacks address different problems. Ingested range history can expose old writes, but a quiet output can leave its watermark stationary and trigger broad scans. Compare append, keyed replacement, and partition replacement with the actual generated statements. Use a synthetic replicated-write fixture to show why a successful mutation status is an execution observation and resulting key counts require separate verification.

**Case study sequence.**

1. Use a rare event to show a model-head watermark scanning almost the entire history on every run. Move the bound to the source tip and simulate an outage longer than the window. Show the skipped keys and backfill the gap before switching strategies.
2. Replay an old source range with a new ingestion timestamp. Derive affected block bounds from the ingested-range ledger. Test the scan cost immediately after a genesis backfill, on a busy stream, and after the range ages out of the lookback cap.
3. Trace a keyed replacement where a replica reads an incomplete temporary key set. Explain how the delete can finish without removing the old keys. Compare adapter versions and settings on the observed runs, including the later recurrence after the upgrade. Use new duplicate keys per run as the outcome and execution logs to investigate the mechanism.

## 06 Decoding & Semantic Models

**Lab.** Decode an event from raw bytes and compare it against a second decoder by full key and typed field. Include a signed amount, a missing optional field, and a change in ABI or deployment.

**Field notes.** Use a synthetic generic emitter to illustrate nested payloads and version-dependent keys. Provider-decoded coverage needs checking per emitter and event. Proxy detection distinguishes bytecode-embedded implementations from storage-based proxies. Preserve create and upgrade history for point-in-time classifications. Where a contract derives an identifier from its fields, recompute it as a self-consistency check.

## 07 Production Pipelines

**Lab.** Establish a history-to-live cutoff, inject an interruption, and replay a bounded range. Check which downstream jobs can see the repair through their normal incremental filters.

**Field notes.** The Airflow cases tie code revision, model selection, seed order, and run timing to what was actually published. Use isolated candidate relations for comparison and verify the scheduled target before promotion. Compare data timestamps and executed SQL when tracing staleness. Pair partition repair with representative memory measurements and separate ingestion failures from shared-cluster contention. Preserve the historical repair procedure alongside the code fix.

## 08 Data Quality & Verification

**Lab.** Start with bounded counts, move to key differences, then compare payloads with aligned types. Inject a missing interval, an exact duplicate, and a conflicting version. Report which evidence supports each finding.

**Field notes.** Match cutoffs and grain before comparing sources. Inspect internal gaps by bucket. Use inexpensive probes to narrow a large audit before exact scans. Record when two downstream results share a source. Public indexed datasets can provide coarse corroboration, while self-consistency, an independent decode, and independently indexed records provide stronger evidence.

## 09 Protocol & Chain Analytics

**Lab.** Choose one published metric and derive it from raw events or historical state. Declare its grain, units, sign convention, exclusions, attribution rules, and valuation cutoff.

- **DEX fills.** Normalize pool perspective, distinguish router intents from venue fills, and separate n-coin pair grain from physical pool identity. Add a protocol through a conformed intermediate and reconcile counts by deployment.
- **Liquidity and TVL.** Compare custody balances, transfer replay, and position state. Use the V3 burn-versus-collect distinction, singleton pool attribution with an unattributed remainder, and rebasing as separate cases. Value holdings at the measurement time.
- **Lending, bridges, and incentives.** Use a multichain market registry, a bridge fact retaining unmatched legs, and distributor-scoped claims. Verify each with the protocol's identity and state transitions.
- **Balances and labels.** Build event-sparse changes and a daily series with explicit exit rows. Distinguish descriptive label assertions from the eligibility rules used in accounting.
- **Prices and revenue.** Audit price source precedence and staleness. Use a synthetic daily-accrual case with effective-dated terms, explicit APR or APY and day-count basis, marginal tiers, and statement reconciliation.
- **Chain and governance metrics.** Derive active and cumulative addresses from their respective roles, decompose a fee spike into price and gas composition, and reconstruct quorum across an upgrade anchor.

## 10 Publishing Analytics

**Lab.** Publish a stock metric and a flow metric over complete periods. Show source freshness, reconcile grouped charts to totals, and simulate one failed feed.

**Field notes.** The dashboard cases show how an unscheduled mart, a partial day, an unmatched label, or duplicate transfers can present as a chart problem. Preserve per-source freshness in cached snapshots. Test joins for fan-out and use an independent supply series for balance reconciliation. In billing reports, distinguish billed compute from query-attributed activity and state the observation window.

## 11 Capstone Systems

Produce a reproducible extract, raw tables, decoded staging, one protocol fact, an audit report, and a dashboard. Include a source comparison, a bounded repair runbook, and a before-and-after verification report. A second operator should be able to reproduce the result from the declared range and inputs.

## Evidence to preserve during drafting

Keep the original question, rejected approaches, failed hypotheses, measurement grain and cutoff, decisive check, and open follow-ups in private research notes. Published lessons keep the reusable mechanism and rebuild it from synthetic or public evidence. Preserve competing explanations until the example establishes which held on the tested version and settings.
