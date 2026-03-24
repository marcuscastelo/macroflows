# ADR 0003: Error handling and simplification defaults

> Status: accepted
> Date: 2026-03-24

## Context

Existing repo instructions diverged on several high-impact defaults:

- whether domain code should use custom error hierarchies
- which error-reporting utilities should be treated as canonical
- whether new work should default to compatibility scaffolding, rollback logic, and fallback-heavy patterns
- which repository quality gate should be treated as the default

Those differences create inconsistent guidance for both humans and agents.

## Decision

Macroflows standardizes these defaults:

- Prefer `pnpm` and `pnpm check` for repository workflows.
- Domain code uses standard `Error` with descriptive messages and optional `cause`.
- Do not introduce custom error hierarchies by default.
- Application and UI layers handle user-facing feedback with `showError` and telemetry with `logging`.
- Do not add new feature-flag, rollout, rollback, or fallback scaffolding by default.
- Preserve compatibility code that still supports active model or data transitions already present in the repo.

## Consequences

- Repo-wide defaults become easier to apply consistently.
- New instructions stop inheriting older model-specific workarounds and contradictory patterns.
- Simplification remains the default without erasing legitimate compatibility work already in progress.

## Canon Sync

- `../../AGENTS.md`
- `../BOUNDARIES.md`
- `../DOCS_GOVERNANCE.md`
