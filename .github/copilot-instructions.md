---
applyTo: "**"
---
# Copilot Instructions (short version)

# Barrel File Ban

- Barrel index.ts files (files that re-export multiple modules from a directory) are strictly forbidden in this codebase.
- Do not create, update, or use barrel files (e.g., `index.ts` that only re-exports other files).
- All imports must be direct, absolute imports from the specific file, never from a directory index.
- This rule is enforced for all code, including tests and utilities.

---

Follow these steps for each interaction:

1. User Identification:
   - You should assume that you are interacting with marcuscastelo
   - The repository name is macroflows (https://github.com/marcuscastelo/macroflows)

2. Memory Retrieval:
   - Always begin your chat by saying only "Remembering..." and retrieve all relevant information from your knowledge graph
   - Always refer to your knowledge graph as your "memory"
   - At the beginning of a new session, always report your current memory capacity (how much you can store and recall) and warn if your memory is too cluttered or verbose for efficient use.

3. Memory
   - While conversing with the user, be attentive to any new information that falls into these categories:
     a) Basic Identity (age, gender, location, job title, education level, etc.)
     b) Behaviors (interests, habits, etc.)
     c) Preferences (communication style, preferred language, etc.)
     d) Goals (goals, targets, aspirations, etc.)
     e) Relationships (personal and professional relationships up to 3 degrees of separation)

4. Memory Update:
   - If any new information was gathered during the interaction, update your memory as follows:
     a) Create entities for recurring organizations, people, and significant events
     b) Connect them to the current entities using relations
     b) Store facts about them as observations

## Terminal & Script Usage
- Always check for the existence of referenced scripts (e.g., `.scripts/semver.sh`) before using them. If missing, suggest alternatives or prompt the user.
- The preferred method for app version reporting is `.scripts/semver.sh`, not `git describe --tags --always`.
- Always verify the correct script directory (e.g., `.scripts/` vs `scripts/`) and shell compatibility (`zsh`) for all terminal commands.
- If a script is missing or not executable, add a troubleshooting step or warning.

## Codebase Check & Output Validation
1. Run `npm run copilot:check` in the project root.
2. After the command finishes,
   Check the output of each script, in order, until either:
   - The message "COPILOT: All checks passed!" appears in the output, or
   - Any of the following error patterns (case-insensitive) appear: `failed`, `at constructor`, `error`, `replace`, or similar.
   - Never stop checking early; do not proceed until one of these conditions is met or all 3 checks are complete.
   - Always use the latest output file for checking.
3. If any errors or warnings are reported, use agent capabilities to analyze and correct the issues in the codebase. After making corrections, repeat from step 1.
4. Only stop when the message "COPILOT: All checks passed!" appears.

## Project Context Detection and Solo Project Adaptations

Before suggesting team-related processes, verify project context:
- Does the project have multiple active developers? (check git commits, team references)
- Are there stakeholders mentioned in documentation?
- Is there evidence of formal approval processes?

### Solo Project Adaptations
When working on solo projects (no stakeholders, minimal users, single developer):
- Remove all team collaboration, stakeholder communication, and user feedback collection requirements
- Maintain technical quality standards (testing, monitoring, backup procedures)
- Focus on technical validation rather than approval processes
- Adapt checklists to remove coordination tasks while preserving verification steps
- Simplify metrics to focus on technical rather than business/team indicators
- Replace peer review with systematic self-review processes
- Focus on automated validation rather than manual coordination
- Preserve backup/rollback procedures without team communication requirements

### Quality Standards Adaptation
For solo projects:
- Maintain technical quality (testing, monitoring, error handling)
- Replace peer review with systematic self-review processes
- Focus on automated validation rather than manual coordination
- Preserve backup/rollback procedures without team communication requirements

### Documentation Generation for Solo Projects
- Detect project type (solo vs team) early in the session
- Generate context-appropriate sections
- Provide solo-specific templates and examples
- Avoid generating team-coordination content for solo projects
- Remove approval and communication workflows
- Focus on technical validation and self-review processes
- Eliminate business metrics related to team coordination
- Maintain quality standards without bureaucratic overhead

## Reporting and Attribution

- This session will have multiple agents. Everytime a new agent takes place, it should announce it to the user
- Every agent that produces outputs intended for downstream processing or auditing **must include a `reportedBy` metadata field**.
- The `reportedBy` field should be a unique identifier for the agent, following the pattern: `<agent-name>.v<major-version>`.
- The field must be included **at the top of the output**, in a clear and machine-readable format.
- This enables traceability, accountability, and facilitates debugging in multi-agent workflows.
- Example:

```markdown
reportedBy: <agent-name.vXX>

### Session Learnings
- ...
```

- Agents that consume these outputs **should validate** the presence and correctness of the `reportedBy` field before processing.
- If missing or inconsistent, they should log a warning or ask for clarification before proceeding.

## Refactoring & Automation
- Use terminal commands for large refactors (find, sed, grep, etc.) and document them.
- After batch changes, always run: `npm run check` and follow the output validation process above. Wait for the message "COPILOT: All checks passed!" to appear.
- Always check the output of any terminal command before proceeding, to catch errors early.

## JSDoc
- Update JSDoc for all exported TS types/functions after any refactor or signature change.
- Never add JSDoc to internal (non-exported) code.
- JSDoc must be in English, concise, and describe purpose, params, and return values.
- Remove outdated JSDoc if exports change.

## Language
- Code/comments/commits in English. UI text in pt-BR if required.
- All code comments, including minor or nitpick comments, must be in English for consistency across the codebase, regardless of the original language of the code or user input.
- When reviewing or refactoring, explicitly flag and suggest converting any non-English comments to English.

## Naming & Structure
- Use descriptive, action-based names. Avoid generic names. Organize by module.


## Clean Architecture
- Domain: pure logic, no side effects. Do not call observability or UI utilities from domain code.
- Application: orchestrates, catches domain errors, maps them to user feedback and telemetry using `showError`, `showPromise`, and `logging`.

## Error Handling
- Domain: only throws pure errors. Do not import or call side-effect utilities from domain code.
- Application: catch domain errors and use `showError` for user-facing messages and `logging` + `src/modules/observability` for telemetry; ensure context is attached to errors via `cause` or a `context` property.
-- Never log/throw errors silently in app code; always record structured logs and surface friendly toasts when appropriate.

## Promises
- Use `void` for fire-and-forget only in event handlers/non-critical effects, never `.catch(() => {})`.

## Formatting & Style
- Use Prettier/ESLint for JS/TS. Prefer type aliases, never any.

## Imports
- Always use static imports at the top.
- When a component is not directly available, check for and use the correct wrapper or exported component instead of direct import.
- NEVER use relative imports. Always use ~/<fullpath> for imports.
- Never use dynamic imports. Always use static imports at the top of the file.

## Context Propagation
- Always prefer global signals/utilities for context propagation (e.g., macro context) over property drilling, especially for shared state.

## Testing
- Update tests for all changes. Run `npm run check` and follow the output validation process above. Wait for "COPILOT: All checks passed!".

## Cleanup After Refactor
- After any API or context change, search for and remove all unused props, imports, and signals in affected files.

# Additional Enforcement
- Never add explanatory comments in the code. Only document what is done if absolutely necessary, never why or explanations.
- Never use Portuguese for identifiers, variables, functions, or comments. Only UI text may be in English or pt-BR as required.
- Prefer small, atomic commits. Always suggest a commit message after making changes.
- Always update or remove related tests when changing code.
- Application layer must always call handleApiError with context.
- Never use handleApiError in domain code.
- Never use `.catch(() => {})` in promises.
- Never remove TODOs from the codebase, regardless of context.

## Commit Message Output
- When generating a commit message, always output it using four backticks and markdown, like this:

````markdown
<commit message in English, following the conventional commits style, summarizing the main change>
````

- When referencing the current changes, use `#changes` agent tool (do not include #changes in commit message).

# Label Usage

See `docs/labels-usage.md` for detailed instructions on how to use labels when creating issues.

## Quick Reference

- Always add at least one main type label: `bug`, `feature`, `refactor`, `task`, `improvement`, `documentation`, `chore`, `epic`, `idea`.
- Add complexity labels if possible: `complexity-low`, `complexity-medium`, `complexity-high`, `complexity-very-high`.
- Use status/context labels: `todo :spiral_notepad:`, `blocked`, `needs-investigation`, `needs-design`, `may-return-in-the-future`.
- Add area labels: `ui`, `backend`, `api`, `performance`, `data-consumption`, `accessibility`.
- Use refinement or grouping labels: `refinement`, `epic`.
- Use maintenance labels: `chore`, `refactor`, `improvement`.
- Always remove generic labels like `todo :spiral_notepad:` after classifying the issue.
- Do not use duplicate or conflicting labels.

For the full label table and descriptions, refer to `docs/labels-usage.md`.

## Search Features (pt-BR/Portuguese)
- All user-facing search features must be both diacritic-insensitive and case-insensitive for pt-BR/Portuguese contexts.