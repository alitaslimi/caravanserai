# Caravanserai

Caravanserai is @AliTslm's living field guide to onchain data: blockchains as public ledgers, data systems, and sources of meaningful insight.

Curriculum content is Markdown. The static pages use shadcn/ui controls rendered with React, Tailwind CSS, and locally bundled Geist fonts.

## Principles

- Content remains readable without the website.
- The site is generated from one canonical lesson format.
- Static pages and the Markdown content build can evolve independently of the UI components.
- New dependencies require a concrete capability that the platform cannot reasonably provide.
- Examples should be reproducible and grounded in real onchain work.

## Repository map

```text
docs/                     Architecture and authoring documentation
curriculum.json           Canonical curriculum sections and planned topics
glossary/                 Shared terms rendered on the glossary page
phases/                   Curriculum phases and lessons
scripts/                  Authoring helpers
site/                     Static pages, styles, runtime modules, and build script
ui/                       shadcn/ui components and their Tailwind theme
LESSON_TEMPLATE.md        Canonical lesson template
ROADMAP.md                Curriculum direction
vercel.json               Static deployment configuration
```

Generated data, UI bundles, and fonts are ignored by Git. Build them locally before starting the static server.

## Local development

Requirements:

- Node.js 22 or newer with npm
- Any static file server; Python is used in the example below

```bash
npm ci
npm run build
python -m http.server 8000 --directory site
```

Open [http://localhost:8000](http://localhost:8000).

The build fails early when a lesson is missing required metadata or contains invalid quiz data.

## Add content

Read [docs/AUTHORING.md](docs/AUTHORING.md) before adding or changing lessons. The short version is:

```bash
scripts/scaffold-lesson.sh 00-setup-and-tooling 02-wallets-rpcs-and-explorers "Wallets, RPCs, and Explorers"
npm run build
```

On Windows, run the scaffold helper in Git Bash or WSL, or copy `LESSON_TEMPLATE.md` into the expected lesson structure manually.

## How it works

`site/build.js` reads the curriculum manifest, lesson frontmatter, lesson Markdown, quiz JSON, and glossary Markdown. It validates and serializes that content into `site/data.js`. The static pages then render the generated data in the browser.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries, data flow, state ownership, and the dependency policy.

## Deployment

Vercel runs `npm run build` and publishes the `site/` directory as static files.
