# Architecture Decision Records

> Doc status: canonical.
> This directory contains accepted ADRs and the ADR template for Macroflows.

## Rules

- Use zero-padded numbering: `0001-...`, `0002-...`, and so on.
- Create a new ADR for cross-cutting or long-lived decisions.
- If an ADR changes current policy, update the canonical docs in the same PR or commit.
- Do not rely on ADRs alone to express current repo policy; keep `AGENTS.md`, `docs/BOUNDARIES.md`, `docs/ARCHITECTURE.md`, and `docs/DOCS_GOVERNANCE.md` in sync.
- When an ADR is replaced, mark it as superseded and link both records.

## Template

- `./_template.md`

## Index

- `0001-canonical-agent-instructions-and-doc-precedence.md`
- `0002-current-repo-architecture-and-boundaries.md`
- `0003-error-handling-and-simplification-defaults.md`
