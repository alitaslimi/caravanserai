# Authoring lessons

Lessons should turn practical experience into material another person can understand, reproduce, and question.

Read [Publication safety](PUBLICATION_SAFETY.md) before adapting private work. Caravanserai publishes reusable mechanisms and verification methods, not organization-specific incidents, identifiers, measurements, or infrastructure.

## Shape the curriculum

Edit `curriculum.json` when adding, renaming, or reordering a curriculum section or its planned topics. This manifest drives the route map on the homepage. Keep it at the level of durable learning outcomes; lesson details belong in Markdown.

Use the [chapter briefs](CHAPTER_BRIEFS.md) for lab and case study material. For each case, record the expected behavior, the observation that contradicted it, and the check that verified the explanation or repair. Name public tools and tested settings when they affect the result. Rebuild private cases as synthetic fixtures or independently reproducible public-chain examples.

Every lesson's `phaseNumber` and phase directory slug must match one manifest entry. The build validates this relationship so the roadmap and authored material cannot silently drift apart.

## Create a lesson

The lesson path determines where its source and artifacts live:

```text
phases/<phase-slug>/<lesson-slug>/
```

Use the scaffold helper from Git Bash, WSL, macOS, or Linux:

```bash
scripts/scaffold-lesson.sh 01-blockchains-as-data 01-blocks-and-transactions "Blocks and Transactions"
```

You can also copy `LESSON_TEMPLATE.md` into `docs/en.md` and create the `code/`, `outputs/`, and optional `quiz.json` files manually.

## Frontmatter

Every `docs/en.md` file begins with:

```yaml
---
title: "Blocks and Transactions"
phase: "Blockchains as Data"
phaseNumber: 1
lessonNumber: 1
type: "Concept"
status: "draft"
tools: []
chains: ["Ethereum"]
protocols: []
datasets: ["blocks", "transactions"]
time: "60 minutes"
---
```

Required fields are validated by `site/build.js`. Use `draft`, `planned`, `in-progress`, or `complete` for `status`.

## Lesson structure

A useful lesson usually includes:

1. Why the subject matters.
2. Clear learning outcomes.
3. The mental model or core mechanism.
4. A small reproducible example.
5. Failure modes, trade-offs, or analyst notes.
6. A lab or question that requires applying the idea.
7. A bridge to the next topic.

Prefer precise claims, explicit table grain, named data sources, and examples that can be rerun. Keep secrets, private endpoints, credentials, and production identifiers out of the repository.

Exact production counts, dates, failure rates, schedules, costs, and distinctive incident chronologies are also private even when they contain no credential. Replace them with labelled synthetic values unless they come from a cited public dataset.

## Code and outputs

- Put runnable examples in `code/`.
- Put expected results and interpretation notes in `outputs/`.
- Keep examples as small as the lesson permits.
- Document external data requirements and reproducibility limits.

## Quizzes

`quiz.json` is optional. Each question uses zero-based answer indexing:

```json
[
  {
    "question": "What does one row represent?",
    "options": ["A block", "A chain", "A database", "A dashboard"],
    "answer": 0,
    "explanation": "The table grain is one row per block."
  }
]
```

## Lesson figures

Use a `flow` fence with JSON fields `caption` and `steps` to render an ordered process. Use a `bars` fence with `caption`, `unit`, and `rows` (label and nonnegative numeric value pairs) for a quantitative comparison. An optional `max` sets a fixed scale. Label observed measurements and synthetic examples in the caption, and explain what the reader should compare in the surrounding prose.

## Validate

Run:

```bash
npm run build
```

Then preview the site and check:

- the lesson appears in the correct phase and order;
- catalog filters reflect its metadata;
- Markdown, code blocks, tables, and links render correctly;
- quiz answers and explanations behave as intended;
- code and output links point to real artifacts.
