# AGENTS.md

> Doc status: canonical.
> This is the canonical repo-wide agent entrypoint for Macroflows.

Macroflows is a SolidJS + TypeScript nutrition tracking platform backed by Supabase. This file is intentionally short: it defines repo-wide policy, the read-first path, command defaults, and where deeper canonical detail lives.

## Policy

### Read-first order

Read these files in order before making non-trivial changes:

1. `AGENTS.md`
2. `docs/BOUNDARIES.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DOCS_GOVERNANCE.md`
5. Any directly relevant ADR under `docs/adr/`

Only canonical docs belong in read-first lists.

### Precedence

- `AGENTS.md` is the canonical repo-wide agent entrypoint.
- More specific canonical docs win inside their own scope:
  - `docs/BOUNDARIES.md` for dependency and ownership rules
  - `docs/ARCHITECTURE.md` for current structure and system map
  - `docs/DOCS_GOVERNANCE.md` for lifecycle, ownership, and update workflow
- ADRs record decision history. They do not silently override canon. If an ADR changes current policy, the same change must update the canonical docs in the same PR or commit.
- `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, audits, migration plans, and tool-specific prompt assets are not canonical.

### Command defaults

- Use `pnpm`.
- Use `pnpm check` as the default repository quality gate.
- Use `pnpm build`, `pnpm test`, and `pnpm lint` for targeted validation when needed.

### Repo-wide defaults

- Prefer clear, explicit code over scaffolding-heavy abstractions.
- Domain code uses standard `Error` with a descriptive message and optional `cause`.
- Application and UI layers handle user-facing feedback with `showError` and telemetry with `logging`.
- Do not add new feature-flag, rollout, rollback, or fallback scaffolding by default.
- Preserve existing compatibility code that still supports active model or data transitions.
- Describe the repo honestly: `src/modules/diet/*` is a large transitional macro-context with internal subdomains, not a completed bounded-context split.

## Workflow

Use the smallest canonical update that matches the change:

- Small repo-wide agent rule or workflow default: update `AGENTS.md`
- Dependency or layer rule change: update `docs/BOUNDARIES.md`
- Current structure or system-map change: update `docs/ARCHITECTURE.md`
- Cross-cutting or long-lived decision: add or supersede an ADR and update canon in the same change
- Audits, investigations, migration notes, and implementation plans: supporting or archived docs only

The repo owner for canonical docs is the repository maintainer. Any change to `AGENTS.md`, `docs/BOUNDARIES.md`, `docs/ARCHITECTURE.md`, `docs/DOCS_GOVERNANCE.md`, or files under `docs/adr/` must update related canonical docs in the same PR or commit.

## References

Canonical docs:

- `docs/README.md`
- `docs/BOUNDARIES.md`
- `docs/ARCHITECTURE.md`
- `docs/DOCS_GOVERNANCE.md`
- `docs/adr/README.md`

Supporting docs remain available for examples, audits, and migration context, but they are not a source of truth.
