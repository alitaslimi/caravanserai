# Architecture

Caravanserai is a generated static site. Its architecture separates authored knowledge from the small amount of code needed to browse it.

## Data flow

```text
curriculum.json + lesson Markdown + quiz JSON + glossary Markdown
                               |
                               v
                        site/build.js
                               |
                               v
                        site/data.js
                               |
                               v
                static HTML + browser modules
```

`site/data.js` is a build artifact. It is regenerated locally and during deployment, and should never be edited by hand.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `site/build.js` | Discover, validate, normalize, and serialize curriculum content |
| `site/app.js` | Render the homepage, curriculum, lessons, quizzes, and glossary |
| `site/header.js` | Render shared navigation and active-page state |
| `site/progress.js` | Store lesson completion and quiz answers in browser storage |
| `site/style.css` | Own design tokens, typography, layouts, and responsive states |
| `ui/` | Render shadcn/ui inputs and buttons into the static pages |
| `site/*.html` | Provide accessible page shells and page-specific mount points |

Modules communicate through stable browser globals created by generated content (`BOOK`, `PHASES`, `LESSONS`, and `GLOSSARY`) and the intentionally small `BookProgress` API.

## Content model

`curriculum.json` is the source of truth for the ordered route map: section titles, summaries, and planned topics. A section can therefore appear before any lessons have been published.

Each published or drafted lesson is a directory under `phases/<phase>/<lesson>/` containing:

```text
docs/en.md       Required lesson prose and frontmatter
quiz.json        Optional knowledge check
code/            Runnable examples or starter artifacts
outputs/         Expected results, screenshots, and notes
```

The build script joins lessons to the matching curriculum section by `phaseNumber` and phase folder slug. Lesson frontmatter remains the source of truth for lesson ordering, filtering, and catalog metadata.

## State ownership

- Curriculum content is immutable at runtime and comes from `site/data.js`.
- Completion and quiz state are device-local and stored under `caravanserai-progress-v1`.
- There is no account, server session, database, or analytics dependency.

## Dependency policy

The content generator uses Node built-ins. The UI build bundles React, shadcn/ui component source, Lucide icons, and self-hosted Geist fonts. Tailwind generates the component utilities at build time. The static pages call the UI through the `BookUI` interface.

Add a dependency only when all of the following are true:

1. It provides a required capability rather than convenience alone.
2. Implementing the capability locally would create more maintenance or security risk.
3. Its runtime and build costs are understood.
4. The decision and removal path are documented here.

Replacing the UI components requires changes to `ui/` and the control mount points. The content bundle and local progress keys are independent of the UI.

## Change guidelines

- Keep authored content out of JavaScript.
- Keep page-specific behavior in `site/app.js` unless a feature earns a clear module boundary.
- Do not edit generated data.
- Validate with `npm run build` after content or build changes.
- Check the homepage, curriculum, one lesson, and glossary after changes affecting shared UI.
