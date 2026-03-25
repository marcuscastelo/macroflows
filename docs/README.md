# Documentation Index

> Doc status: canonical.
> This file maps Macroflows documentation by status so contributors and agents can find the current source of truth quickly.

## Read First

For repo-wide changes, read these first:

1. `../AGENTS.md`
2. `./BOUNDARIES.md`
3. `./ARCHITECTURE.md`
4. `./DOCS_GOVERNANCE.md`
5. Relevant ADRs under `./adr/`

## Canonical

- `../AGENTS.md` — repo-wide agent policy, precedence summary, and workflow routing
- `./BOUNDARIES.md` — normative ownership and dependency rules
- `./ARCHITECTURE.md` — current architecture map and transitional realities
- `./DOCS_GOVERNANCE.md` — lifecycle, ownership, precedence, and banner rules
- `./adr/README.md` — ADR index and usage rules

## Operational Behaviors

- Canary/rc fatal errors surface a “Trocar de versão” prompt that reopens the same route on the stable URL. Heuristics favor network/5xx/runtime faults and de-duplicate via a repeat threshold (default 2 events within 5 minutes). Configure via env keys: `VITE_RELEASE_CHANNEL` (canary|rc|stable), `VITE_STABLE_BASE_URL` (override mapping), `VITE_SWITCH_TO_STABLE_ENABLED` (default true), `VITE_SWITCH_REPEAT_THRESHOLD`, and `VITE_SWITCH_REPEAT_WINDOW_MS`.

## Pointer

- `../CLAUDE.md`
- `../GEMINI.md`
- `../.github/copilot-instructions.md`

Pointer docs exist for tool-specific entrypoints only. They are not canonical.

## Supporting

- `./ARCHITECTURE_GUIDE.md`
- `./CODESTYLE_GUIDE.md`
- `./ARCHITECTURE_AUDIT.md`
- `./audit_domain.md`
- `./audit_domain_diet.md`
- `./audit_domain_diet_food.md`
- `./audit_domain_diet_recipe.md`
- `./audit_sections.md`
- `./COPILOT_SHORT_GUIDE.md`
- `../DI-migration-plan.md`
- `./RECIPE_MIGRATION_AUDIT.md`
- `./DEPRECATION_PLAN_V0.14.0.md`
- `../.github/COPILOT_SETUP_VALIDATION.md`

Supporting docs preserve context, examples, audits, or migration notes. They are not a source of truth.

## Archived

- `./archive/TODO-REPO-DOC.md`

Archived docs are historical material retained for reference only.
