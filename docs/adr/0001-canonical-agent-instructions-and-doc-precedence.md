# ADR 0001: Canonical agent instructions and doc precedence

> Status: accepted
> Date: 2026-03-24

## Context

Macroflows accumulated multiple assistant-specific instruction files over time, including `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md`. They grew independently, started to overlap, and eventually contradicted one another.

The repo also accumulated audits, migration plans, and tool-specific prompt assets. Those documents contain useful context, but they should not compete with the current source of truth.

## Decision

Macroflows adopts a canonical documentation model:

- `AGENTS.md` is the canonical repo-wide agent entrypoint.
- `docs/BOUNDARIES.md`, `docs/ARCHITECTURE.md`, and `docs/DOCS_GOVERNANCE.md` are canonical within their specific scopes.
- `docs/adr/` stores decision history, not silent policy overrides.
- `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` become thin pointer files.
- Supporting, deprecated, and archived docs must be clearly labeled so they cannot be mistaken for canon.

## Consequences

- The repo gets a single, explicit read-first path for humans and agents.
- Tool-specific entrypoints remain compatible with existing ecosystems without owning policy.
- Historical docs remain available, but source-of-truth ambiguity is removed.
- Canonical docs must be updated together when policy changes cross document boundaries.

## Canon Sync

- `../../AGENTS.md`
- `../BOUNDARIES.md`
- `../ARCHITECTURE.md`
- `../DOCS_GOVERNANCE.md`
