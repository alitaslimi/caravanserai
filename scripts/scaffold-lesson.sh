#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: scripts/scaffold-lesson.sh <phase-slug> <lesson-slug> <title>"
  echo "Example: scripts/scaffold-lesson.sh 00-setup-and-tooling 02-wallets-rpcs-and-explorers \"Wallets, RPCs, and Explorers\""
  exit 1
fi

phase_slug="$1"
lesson_slug="$2"
title="$3"

phase_number="${phase_slug%%-*}"
lesson_number="${lesson_slug%%-*}"
phase_title="$(printf '%s' "${phase_slug#*-}" | tr '-' ' ' | sed -E 's/(^| )([a-z])/\1\u\2/g')"
lesson_dir="phases/${phase_slug}/${lesson_slug}"

mkdir -p "${lesson_dir}/docs" "${lesson_dir}/code" "${lesson_dir}/outputs"

cat > "${lesson_dir}/docs/en.md" <<EOF
---
title: "${title}"
phase: "${phase_title}"
phaseNumber: ${phase_number#0}
lessonNumber: ${lesson_number#0}
type: "Build"
status: "draft"
tools: []
chains: []
protocols: []
datasets: []
time: "60 minutes"
---

# ${title}

## Why It Matters

Explain the onchain analytics problem this lesson helps solve.

## Outcomes

- Define the core concept.
- Build or inspect a small artifact.
- Connect the artifact to a production analytics workflow.

## Lab

Describe the exercise here.
EOF

cat > "${lesson_dir}/code/README.md" <<EOF
# Code

Add lesson code artifacts here.
EOF

cat > "${lesson_dir}/outputs/README.md" <<EOF
# Outputs

Record expected results, query output notes, or dashboard screenshots here.
EOF

cat > "${lesson_dir}/quiz.json" <<EOF
[
  {
    "question": "What is the main idea of this lesson?",
    "options": ["Replace this option", "Replace this option", "Replace this option", "Replace this option"],
    "answer": 0,
    "explanation": "Replace this explanation."
  }
]
EOF

echo "Created ${lesson_dir}"
echo "Run: node site/build.js"
