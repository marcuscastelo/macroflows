# ADR 0002: Current repo architecture and boundaries

> Status: accepted
> Date: 2026-03-24

## Context

Macroflows already has strong module and layering patterns, but the real repo structure is more nuanced than a simplified clean-architecture diagram suggests. In particular, `src/modules/diet/*` behaves as a large transitional macro-context with several internal subdomains.

Without an explicit architectural record, future docs risk describing an aspirational architecture that the codebase does not yet match.

## Decision

Macroflows documents the current architecture honestly:

- `src/modules/*` owns business-facing module logic
- `src/sections/*` owns feature and page composition
- `src/shared/*` owns technical cross-cutting code
- `src/routes/*` owns route entrypoints and API endpoints
- `src/di/*` owns dependency wiring and composition
- `src/modules/diet/*` is treated as a large transitional macro-context, not a completed bounded-context split

Dependency and ownership rules are defined normatively in `docs/BOUNDARIES.md`, while the structure itself is described in `docs/ARCHITECTURE.md`.

## Consequences

- Canonical docs no longer pretend the repo is more normalized than it is.
- Boundary discussions can be grounded in current code instead of abstract diagrams.
- Future structural refactors can update canon incrementally as the code changes.

## Canon Sync

- `../../AGENTS.md`
- `../BOUNDARIES.md`
- `../ARCHITECTURE.md`
