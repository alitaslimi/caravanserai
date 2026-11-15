from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def run(command: list[str], cwd: Path = ROOT) -> None:
    subprocess.run(command, cwd=cwd, env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}, check=True)

test_files = sorted((ROOT / "phases").rglob("test_*.py"))
test_files += sorted((ROOT / "examples").rglob("test_*.py"))
for test_file in test_files:
    run([sys.executable, "-m", "unittest", "discover", "-p", test_file.name], test_file.parent)

examples = [
    "phases/02-alchemy-and-rpc-data-access/03-reorg-safe-historical-reads/code/chain_cursor.py",
    "phases/03-envio-and-hypersync/03-planning-ranges-and-backpressure/code/range_planner.py",
    "phases/06-decoding-and-semantic-models/03-resolving-proxies-and-abi-eras/code/abi_registry.py",
    "phases/06-decoding-and-semantic-models/04-normalizing-execution-traces/code/normalize_traces.py",
    "phases/09-protocol-and-chain-analytics/06-reconstructing-governance-state/code/governance_replay.py",
    "phases/11-capstone-systems/01-replayable-onchain-pipeline/code/reconcile.py",
]
for example in examples: run([sys.executable, str(ROOT / example)])
print(f"Ran {len(examples)} executable examples and all discovered unit tests.")

