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

## Serena MCP

- Prefer Serena MCP tools whenever they can perform the task. Use them first for project activation, onboarding, file and symbol discovery, memory operations, refactors, edits, and shell execution.
- At the start of each chat, determine the active project from the current `pwd` and activate it before doing other project-aware work.
- Keep one Serena project per worktree, with the project name derived from the base repo name:
  - `/home/marucs/Development/macroflows/macroflows/` -> `macroflows`
  - `/home/marucs/Development/macroflows/wt/<worktree>/` -> `macroflows-<worktree>`
- After activation, check whether onboarding was already performed before doing anything substantial.
- Use `delete_memory` only when the user explicitly asks for it.
- If Serena is unavailable or a task is outside Serena's scope, fall back to the next-best local tool.

### Serena tool glossary

- `activate_project`: opens the Serena project for the current repo or worktree.
- `check_onboarding_performed`: verifies whether the project already has onboarding data.
- `create_text_file`: creates or overwrites a text file inside the project.
- `delete_memory`: deletes a memory file, only when the user explicitly asks.
- `edit_memory`: updates a memory file by replacing text that matches a pattern.
- `execute_shell_command`: runs a shell command inside the project context.
- `find_file`: finds files by name or path pattern.
- `find_referencing_symbols`: finds code symbols that reference another symbol.
- `find_symbol`: finds code symbols by name, scope, or path.
- `get_current_config`: shows the active Serena configuration, projects, tools, contexts, and modes.
- `get_symbols_overview`: lists the top-level symbols in a file.
- `initial_instructions`: shows Serena usage instructions when the client does not load them automatically.
- `insert_after_symbol`: inserts new content after a symbol definition.
- `insert_before_symbol`: inserts new content before a symbol definition.
- `list_dir`: lists files and folders in a directory.
- `list_memories`: lists available memory files for the project.
- `onboarding`: records project structure and basic working knowledge for Serena.
- `prepare_for_new_conversation`: prepares the project context for a new chat.
- `read_file`: reads a file from the project directory.
- `read_memory`: reads a memory file when it is relevant to the task.
- `rename_memory`: renames or moves a memory file.
- `rename_symbol`: renames a code symbol across the codebase.
- `replace_content`: replaces text in a file, optionally with a regex.
- `replace_symbol_body`: replaces the full body of a symbol.
- `search_for_pattern`: searches the project for arbitrary text or regex patterns.
- `write_memory`: writes a new memory file with useful project context.

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
