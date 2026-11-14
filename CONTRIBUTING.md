# Contributing to Caravanserai

Caravanserai is a personal field guide, but improvements are welcome when they make the material clearer, more reproducible, or more useful to people working with onchain data.

## Before changing content

- Read [docs/AUTHORING.md](docs/AUTHORING.md) for the lesson format and validation checklist.
- Read [docs/PUBLICATION_SAFETY.md](docs/PUBLICATION_SAFETY.md) before adapting private operational experience.
- Check [ROADMAP.md](ROADMAP.md) for the intended curriculum location.
- Preserve the distinction between authored content and generated site data.

## Before changing the site

- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Keep UI dependencies scoped to the UI build.
- Keep modules focused: content ingestion in `build.js`, rendering in `app.js`, navigation in `header.js`, progress state in `progress.js`, and presentation in `style.css`.

## Validate every change

```bash
npm ci
npm run build
python -m http.server 8000 --directory site
```

Check the homepage, curriculum, one representative lesson, and the glossary. Do not commit credentials, private URLs, organization-specific identifiers or measurements, generated `site/data.js`, or machine-specific artifacts.
