# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript frontend (components, hooks, `App.tsx`, `index.css`). Level editor in `src/editor/`.
- `convex/`: Backend functions and engine (submodules: `agent/`, `engine/`, `util/`, `aiTown/`, `_generated/`).
- `assets/`, `public/`, `data/`: Static assets, public files, and map/character data.
- Config: `vite.config.ts`, `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, `jest.config.ts`. Docs: `README.md`, `ARCHITECTURE.md`.

## Architecture Overview
- Frontend: React + Vite renders the town (PixiJS) and calls Convex functions; state flows via reactive Convex queries.
- Backend: Convex TypeScript functions model the world; `convex/world.ts` orchestrates state, `engine/abstractGame.ts` defines the tick/update loop, and `engine/historicalObject.ts` manages time-indexed data.
- Agents: `convex/agent/` handles memory, embeddings, and conversations; `util/llm.ts` selects the LLM provider (Ollama/OpenAI/Together/custom) and enforces embedding dimensions.
- Scheduling & I/O: `crons.ts` for recurring jobs, `http.ts` for webhooks/HTTP actions, `init.ts` seeds maps/characters from `data/`.
- Data: Schemas live in `convex/schema.ts` and `convex/engine/schema.ts`; client updates are pushed live via Convex reactivity.

## Build, Test, and Development Commands
- `npm run dev`: Run backend + frontend together.
- `npm run dev:backend` / `npm run dev:frontend`: Run each side separately.
- `npm run build`: Type-check (`tsc`) and build via Vite.
- `npm test`: Run Jest tests (TS-ESM preset).
- `npm run dashboard`: Open Convex dashboard. Level editor: `npm run level-editor`.
- Backend admin tasks (examples): `npx convex run init`, `npx convex run testing:stop|resume|kick`.

## Coding Style & Naming Conventions
- TypeScript, React function components, 2-space indent (enforced by Prettier).
- Formatting: `prettier` config with single quotes, trailing commas; run `npm run lint` before PRs.
- ESLint: `@typescript-eslint` rules; unused vars prefixed `_` allowed.
- Filenames: use `camelCase.ts` for utils, `PascalCase.tsx` for components; colocate component styles.

## Testing Guidelines
- Framework: Jest + ts-jest.
- File naming: `*.test.ts`/`*.test.tsx` near source (see `convex/util/*.test.ts`).
- Scope: unit-test utilities and engine logic; mock external services. Run `npm test` locally.

## Commit & Pull Request Guidelines
- Commits: short, imperative summaries (e.g., "fix avatar crop", "update convex").
- PRs: clear description, linked issues, and screenshots/GIFs for UI changes.
- Quality gate: run `npm run lint`, `npm test`, and ensure `npm run build` succeeds.
- Keep PRs focused; update docs (`README.md`, `ARCHITECTURE.md`) when behavior changes.

## Security & Configuration Tips
- Local env: `.env.local`; set Convex/LLM keys via `npx convex env set KEY value`.
- Be careful with destructive tasks (e.g., `npx convex run testing:wipeAllTables`).
- See `README.md` for LLM provider selection and deployment notes.
