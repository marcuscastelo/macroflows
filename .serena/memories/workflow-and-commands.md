# Workflow and Commands (consolidated)

This memory consolidates development workflow, commands, quality checks, and workflow optimization patterns.

## Essential Commands
- `pnpm dev` — Start development server (local)
- `pnpm check` — Mandatory quality gate (lint, type-check, test)
- `pnpm fix` — Auto-fix ESLint issues
- `pnpm build` — Production build
- `pnpm type-check` — TypeScript checking
- `pnpm test` — Run Vitest tests
- `pnpm gen-app-version` — Generate app version
- `npm run copilot:check` — Run copilot checks as described in `copilot-instructions.md`

## Claude Commands (helpers)
- `/fix` — Automated codebase checks and fixes
- `/review` — Code review helper
- `/commit` — Generate and execute conventional commit
- `/pull-request` or `/pr` — Create PR

## Quality Gate & Check Strategy
1. Run `npm run copilot:check` when requested by workflows.
2. If failures occur: re-run up to 2 times, then collect logs and perform targeted diagnostics.
3. Always ensure `pnpm check` passes before declaring a task complete.

## Optimization Patterns
- Batch related operations when safe (e.g., lint + typecheck + test).
- Use memory entries to cache common search patterns and workflow context for faster discovery.
- For solo projects, simplify coordination steps and rely on self-review + automated checks.

## Issue Discovery
- Search TODO/FIXME/XXX patterns first (`search_for_pattern`).
- Verify existing issues before creating new ones.

## Agent Handoff
- Load relevant memories before handing tasks to specialized agents (e.g., `workflow-optimization-patterns`, `project-context-macroflows`).
- Preserve context with a short summary and pointers to related memories.

For detailed examples and specific shell commands, see `suggested_commands` and `development_workflow` memories.