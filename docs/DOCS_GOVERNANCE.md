# Docs Governance

> Doc status: canonical.
> This file defines documentation lifecycle, ownership, precedence, and update workflow for Macroflows.

## Purpose

Macroflows keeps historical material, audits, and tool-specific assets on purpose. This file prevents those materials from competing with the current source of truth.

## Canonical Docs

The current canonical set is:

- `../AGENTS.md`
- `./ARCHITECTURE.md`
- `./BOUNDARIES.md`
- `./DOCS_GOVERNANCE.md`
- `./adr/README.md`
- accepted ADRs under `./adr/`

Canonical docs must stay aligned. If a change updates one canonical doc and affects the others, update the related canonical docs in the same PR or commit.

## Ownership

- Owner: the repository maintainer.
- Canonical doc changes are part of implementation work, not optional cleanup.
- Any change to `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/BOUNDARIES.md`, `docs/DOCS_GOVERNANCE.md`, or `docs/adr/*` must leave the canonical set internally consistent.

## Precedence

1. The most specific canonical doc for the subject
2. `AGENTS.md` as the canonical repo-wide entrypoint
3. Pointer files such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md`
4. Supporting docs
5. Deprecated docs
6. Archived docs

ADRs record decision history. They do not silently override current canon. If an ADR changes current policy, the canonical docs must be updated at the same time.

## Lifecycle Statuses

Use one of these statuses near the top of each managed doc:

- `canonical`: current source of truth for an active concern
- `pointer`: thin entrypoint that forwards readers to canonical docs
- `supporting`: useful context, examples, audits, migration notes, or tool-specific guidance that is not authoritative
- `deprecated`: still present but scheduled for removal or replacement
- `archived`: historical material retained for reference only

## Banner Rules

- Canonical docs declare `Doc status: canonical.`
- Pointer docs declare `Doc status: pointer.`
- Supporting docs declare `Doc status: supporting.` and say they are not a source of truth.
- Archived docs declare `Doc status: archived.` and live under `docs/archive/` when practical.

## Update Workflow

Use the smallest document that matches the change:

- Small repo-wide agent rule or workflow default: update `AGENTS.md`
- Dependency direction or ownership change: update `docs/BOUNDARIES.md`
- Current structure or system map change: update `docs/ARCHITECTURE.md`
- Cross-cutting or long-lived decision: add or supersede an ADR and update canon in the same change
- Audits, investigations, migration plans, and implementation notes: supporting or archived docs only

## Enforcement

`pnpm docs:check` validates the docs-governance contract. It is part of `pnpm check` and therefore part of CI.

The check verifies:

- required canonical files exist
- root pointer files point to `AGENTS.md` and state precedence
- canonical docs do not prefer legacy quality-gate commands
- top-level docs do not describe `.github/copilot-instructions.md` as the main instruction file
- supporting and archived docs that are part of the managed set contain a status banner
- ADR numbering and index/template references are consistent

## See Also

- `../AGENTS.md`
- `./README.md`
- `./adr/README.md`
