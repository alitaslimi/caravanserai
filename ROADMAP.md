# Caravanserai roadmap

The site reads its route map from [`curriculum.json`](curriculum.json). The [chapter briefs](docs/CHAPTER_BRIEFS.md) turn the infrastructure sessions into teaching goals, labs, and case studies.

## Next lessons

1. Write **Blockchains as Data** around a bounded fixture of blocks, transactions, receipts, logs, and traces. Declare grain, keys, ordering, and coverage.
2. Extract that same range via JSON-RPC and an indexed source. Reconcile the normalized records and explain any differences in coverage.
3. Load the fixture into a warehouse, replay a batch, and verify keys, exact values, and scan cost.
4. Decode an event and build a published fact through staging and conformance. Add a new deployment and test its history against existing watermarks.
5. Carry the fact through a bounded repair and into a dashboard with an explicit freshness contract. Reuse the same fixture for the capstone.

## Editorial principle

Each lesson starts with a question the reader can answer across stacks. Labs name the engine, adapter, client, or protocol they exercise. Field notes show the original symptom, the checks that established its cause, and how the repair was verified. Use public chain data or synthetic fixtures when adapting production incidents.
