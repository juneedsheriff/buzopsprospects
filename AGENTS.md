# AGENTS.md

Guidance for AI agents working in this repository.

## Project status

`buzopsprospects` is currently a **stub repository**. It contains only `README.md` with the project title. There is no application source code, dependency manifest, test suite, linter configuration, or service definitions yet.

## Cursor Cloud specific instructions

### Services

| Service | Status | Notes |
|---------|--------|-------|
| Application | Not present | No frontend, backend, or API code in the repo |
| Database | Not present | No schema or migration files |
| Docker / compose | Not present | No `docker-compose.yml` or `Dockerfile` |

There is nothing to start, lint, test, or build until application code is added.

### Development workflow (when code exists)

Once the project is scaffolded, update this section with:

- Package manager and install command (e.g. `npm install`, `uv sync`)
- Dev server start command (e.g. `npm run dev`)
- Lint command (e.g. `npm run lint`)
- Test command (e.g. `npm test`)
- Required environment variables (reference `.env.example` when added)

### Current VM update script

The startup update script is a no-op (`true`) because there are no dependencies to refresh. Replace it with real install commands once a dependency manifest is committed.
