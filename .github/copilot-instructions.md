---
applyTo: "**"
---
# Copilot Instructions (short version)

# Barrel File Ban

- Barrel `index.ts` files (files that re-export multiple modules from a directory) are strictly forbidden in this codebase.
- Do not create, update, or use barrel files (e.g., `index.ts` that only re-exports other files).
- Prefer importing directly from the specific file to avoid ambiguous imports and improve tree-shaking.

---

Follow these steps for each interaction:

1. User Identification:
   - Assume you are interacting with `marcuscastelo`.
   - The repository name is `macroflows` (https://github.com/marcuscastelo/macroflows).

## Terminal & Script Usage
- Verify the existence and executability of referenced scripts (for example `.scripts/semver.sh`) before invoking them. If missing, suggest alternatives or prompt for guidance.
- Prefer repository-specific scripts and documented patterns for version reporting and automation. If a particular script is required by a workflow, document its expected location and shell compatibility.

## Codebase Check & Output Validation
1. Run `npm run copilot:check` in the project root when asked to verify repository checks.
2. After the command finishes, inspect the output of each script in order. Act when:
   - The message "COPILOT: All checks passed!" appears in the output, or
   - Serious error patterns appear (case-insensitive): `failed`, `at constructor`, `error`, `replace`, or similar.
3. On failures or warnings:
   - Re-run the check up to two additional times to rule out transient or flaky failures.
   - If failures persist, collect the latest output and run targeted diagnostics (linters, unit tests) to localize the cause.
   - If unresolved, open an issue with the collected logs and notify/assign relevant maintainers.
4. Do not block work indefinitely on flaky checks; follow the retry and escalation steps above.

## Project Context Detection and Solo Project Adaptations

Before suggesting team-related processes, detect project context:
- Are there multiple active developers? (inspect git history)
- Are stakeholders or formal approval processes documented?

### Solo Project Adaptations
When operating in a solo-project context (single developer, minimal stakeholders):
- Remove team-specific coordination requirements from suggested workflows.
- Maintain technical quality (tests, monitoring, backups) while simplifying collaboration overhead.
- Replace peer-review steps with systematic self-review and automated checks.
- Convert coordination tasks into automated validations or lightweight checklists.

### Quality Standards Adaptation
- Maintain technical quality: testing, monitoring, and error handling.
- Prefer automated validation and systematic self-review in solo setups.

### Documentation Generation for Solo Projects
- Detect project type early and generate context-appropriate documentation and templates.
- Avoid adding team-coordination workflows for solo projects.

## Reporting and Attribution

- Use a `reportedBy` metadata field only for outputs intended for downstream processing or automated auditing (for example: structured logs, machine-readable artifacts, PR automation metadata, or audit documents).
- When required for machine-to-machine consumption, `reportedBy` should follow the pattern `<agent-name>.v<major-version>`.
- For casual conversational replies or interactive assistance, `reportedBy` is not required.
- When included, place `reportedBy` at the top of the machine-readable output in a clear, parseable format.

Example (machine-to-machine output):

```markdown
reportedBy: <agent-name.vXX>

### Session Learnings
- ...
```

## Refactoring & Automation
- For large refactors, use terminal commands and document what was changed and why (commands used, scope, and verification steps).
- After batch changes, run `npm run check` and follow the Codebase Check & Output Validation guidance above.
- If checks fail repeatedly, follow retry and escalation procedures; do not loop indefinitely until a single string appears.

## JSDoc
- Required: Add JSDoc to all exported TypeScript types, interfaces, and functions describing purpose, parameters, and return values.
- Internal (non-exported) code may include concise comments when necessary; prefer clear code and tests.
- Use internal comments to explain non-obvious rationale that helps future maintainers.
- Avoid adding JSDoc to purely internal helpers unless it provides clear value.

## Language
- Use English for all code identifiers, comments, and commit messages to maximize accessibility.
- Localize UI text where appropriate (for example: `pt-BR` for user-facing strings) and document localization locations.

## Naming & Structure
- Use descriptive, action-oriented names. Avoid vague identifiers. Organize code by module and responsibility.

## Clean Architecture
- Domain layer: pure logic, no side effects (no UI or observability calls).
- Application layer: orchestrates use cases, catches domain errors, and integrates with UI/observability utilities.

## Error Handling
- Domain code should throw pure errors only.
- Application code should catch domain errors and use `showError` for user-facing messages and `logging` + `src/modules/observability` for telemetry.
- Attach context to errors using `cause` or a `context` property when available.
- Do not log or throw errors silently; always record structured logs and surface friendly messages when appropriate.

## Promises
- Do not silently swallow errors with patterns like `.catch(() => {})`.
- If an error is intentionally ignored, document the reason inline and/or send it to centralized logging, for example:
  - `.catch(err => { /* intentionally ignored because ... */ })`
  - `.catch(logging.capture)`
- Use `void` for fire-and-forget only in event handlers or clearly non-critical effects. Always consider and document failure modes.

## Formatting & Style
- Use Prettier and ESLint for JS/TS formatting and linting.
- Prefer type aliases over `any` in TypeScript and follow repository linting rules.

## Imports
- Prefer static imports at the top of modules for clarity and toolchain compatibility.
- Barrel files (directory index re-exports) are forbidden; always import directly from the specific file.
- When a wrapper or an exported helper exists, import that wrapper instead of reaching into internals.
- If the project adopts absolute import aliases (for example `~/<fullpath>`), document the required `tsconfig` / bundler configuration.
- Exceptions for import style (e.g., dependency injection patterns, test utilities, or framework constraints) should be documented and justified.

Examples:
- Preferred static import: `import { Button } from '~components/ui/Button'`
- When a wrapper is intended: `import { withAuth } from '~lib/wrappers/withAuth'` (import the wrapper, not internals)

## Context Propagation
- Prefer global signals/utilities for widely shared context (for example, macro context) to avoid deep prop drilling when appropriate.

## Testing
- Update tests for all behavior changes and run `npm run check` after changes.
- Use the retry and escalation steps when checks are flaky; do not block indefinitely on transient failures.

## Cleanup After Refactor
- After API or context changes, search for and remove unused props, imports, and signals in affected modules.

# Additional Enforcement
- Avoid blanket prohibitions that harm maintainability; prefer explained guidance with concrete examples and documented exceptions.
- Use English for code and comments. Localized UI text is permitted where appropriate.
- Prefer small, atomic commits; document recommended commit messages.
- Always update or adjust tests when changing behavior.
- Keep TODOs actionable: convert to issues or review them periodically rather than keeping them permanently in code.

## Commit Message Output
- Use Conventional Commits as the standard format for commit messages. Provide a short header and an optional body.

Example:

```markdown
feat(parser): add support for X

Add a brief description of the change and reasoning.
```

- When producing automated outputs that reference changes, use repository tooling and documented automation fields (for example `#changes`) to surface diffs.

# Label Usage

Refer to `docs/labels-usage.md` for full rules. The guidance below is intentionally advisory rather than prescriptive.

## Quick Reference

- Prefer at least one main type label: `bug`, `feature`, `refactor`, `task`, `improvement`, `documentation`, `chore`, `epic`, `idea`.
- Add complexity labels when helpful: `complexity-low`, `complexity-medium`, `complexity-high`, `complexity-very-high`.
- Use status/context labels where they add value: `todo :spiral_notepad:`, `blocked`, `needs-investigation`, `needs-design`, `may-return-in-the-future`.
- Add area labels when useful: `ui`, `backend`, `api`, `performance`, `data-consumption`, `accessibility`.
- Use grouping/refinement labels: `refinement`, `epic`.
- Remove or reclassify generic labels like `todo :spiral_notepad:` during triage.
- Avoid duplicate or conflicting labels.

For the full label table and descriptions, refer to `docs/labels-usage.md`.

## Search Features (pt-BR/Portuguese)
- All user-facing search features must be both diacritic-insensitive and case-insensitive for pt-BR/Portuguese contexts.

## Memory Usage

This project supports the use of persistent agent memories to capture and reuse project-specific context, workflows, and heuristics. Use memories thoughtfully and sparingly: they are intended to speed up repeated tasks and preserve institutional knowledge, not to store transient or sensitive information.

### Purpose
- Persist important, project-specific guidance or context that helps the agent perform actions consistently (examples: architecture decisions, workflow checklists, common search patterns).
- Capture outcomes of long-running analysis or handoffs that will be reused across sessions.
- Store canonical summaries or indexes to speed discovery (e.g., module map, developer-guidelines, workflow-and-commands).

### When to Write Memories
- After producing a stable summary or guideline that will be reused (architecture decisions, consolidated dev rules).
- When a repeated operational pattern is discovered (search patterns, command sequences).
- When completing a migration or a non-trivial refactor that others may need to reference later.
- Prior to handing off context to another agent or human to preserve decisions.

Recommended memory names (examples):
- `project-context-macroflows`
- `developer-guidelines`
- `workflow-and-commands`
- `module-map`
- `lessons-learned`

### When to Read Memories
- Read a memory only if it is clearly relevant to the task at hand.
- Avoid re-reading the same memory multiple times in the same conversation.
- Prefer targeted memory reads (specific memory names) over broad searches.

### Memory Format & Naming
- Store memories in Markdown for readability.
- Use clear, descriptive memory names (snake-case or kebab-case recommended).
- Include a short metadata header in the memory body when useful (e.g., `lastUpdated`, `reportedBy` for machine-readable outputs).
- Do NOT store secrets, credentials, or PII in memories.

Example memory structure (Markdown):
- Title
- Purpose
- Short summary
- Relevant links/paths in the repo
- Actions or next steps
- lastUpdated: YYYY-MM-DD
- reportedBy: <agent-name.vX> (optional for machine artifacts)

### Editing & Deleting Memories
- Use precise edits when updating memories (preserve historical notes if relevant).
- If a memory becomes obsolete, delete it rather than leaving outdated content.
- If only part of a memory is obsolete, update that section and add a changelog entry with `lastUpdated`.

### Security & Privacy
- Never write API keys, secrets, or personal data to memories.
- Sensitive or restricted information must be referenced indirectly (e.g., “see secure vault”) rather than stored in memory.
- If an accidental secret is written to a memory, delete the memory immediately and follow repository security procedures.

### Usage Patterns & Examples
- Before performing cross-module refactors, load `developer-guidelines` and `module-map` to verify naming and layering rules.
- For repetitive searches (e.g., "recipe edit" TODOs), store the search regex in a memory to avoid re-deriving it each session.
- Use a `lessons-learned` memory to capture post-mortems; convert actionable items into GitHub issues.

### Best Practices
- Keep memories small and focused; prefer several specific memories over a single large blob.
- Use consistent naming so memories are discoverable.
- Prefer writable canonical docs in the repository for rules that must be visible to humans; memories are a complementary convenience for the agent.
- When automating workflows or commands, reference memories in the automation steps (e.g., load `workflow-and-commands` before running batch validation).
- Treat memories as first-class artifacts: update them when processes change.

### Integration with Agent Workflows
- Load relevant memories during agent handoffs to preserve context (e.g., architecture rules, active migrations, quality gate expectations).
- When producing machine-readable outputs intended for automation or audit, include `reportedBy: <agent-name.vX>` at the top of the artifact.
- Use memories to reduce redundant discovery steps (e.g., mapping TODOs to known issue areas), but validate memory contents against the repository when precision matters.

By following these guidelines, memories become a reliable accelerator for consistent, high-quality assistance without compromising security or clarity.
