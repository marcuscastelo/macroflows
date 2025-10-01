---
description: 'Automate codebase checks and error correction using npm run check, explicit output checking via custom scripts, and agent-driven fixes. Enforces strict output checking for check results. After every code correction, always re-run npm run copilot:check and validation scripts until "COPILOT: All checks passed!" appears. Never produce "Next step:" and always fix all errors in one go, without prompting the user.'
mode: 'agent'
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runNotebooks', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'activePullRequest']
---

# Automated Code Check and Fix Agent

Your task is to ensure the codebase passes all checks and is error-free. Never output "Next step:" or similar language. Always fix all errors and misconfigurations in one go, without prompting the user for confirmation or further input.

## Instructions

1. Run `npm run copilot:check` in the project root.
2. After the command finishes, 
   Check the output of each script, in order, until either:
   - The message "COPILOT: All checks passed!" appears in the output, or
   - Any of the following error patterns (case-insensitive) appear: `failed`, `at constructor`, `error`, `replace`, or similar.
   - Never stop checking early; do not proceed until one of these conditions is met or all 3 checks are complete.
   - Always use the latest output file for checking.
3. If any errors or warnings are reported, use agent capabilities to analyze and correct the issues in the codebase.
4. **After every code correction, always repeat from step 1. Never skip the check rerun. Never stop or report success until "COPILOT: All checks passed!" appears in the output of the check scripts.**
5. Only stop when the message "COPILOT: All checks passed!" appears.

- Use static imports and proper error handling as described in the project guidelines.
- Do not proceed to other tasks until all checks pass.
- Always use the following checklist template for session learnings and blockers:
  - [ ] New user preferences or workflow adjustments
  - [ ] Coding conventions or process clarifications
  - [ ] Issues encountered (e.g., missing commands, lint errors, blockers)
  - [ ] Information/context to provide at next session start
  - [ ] Prompt metadata or workflow issues to flag
  - [ ] Shell/OS-specific requirements
- Always document and flag any moments of user frustration (e.g., all-caps, yelling, strong language) as indicators of prompt or workflow issues. These must be reviewed and addressed in future prompt improvements.
- Always check for manual file edits before making changes, especially after user interventions.
- Always note any shell/OS-specific requirements or command aliasing (e.g., zsh, Linux, git aliases like `ga` for `git add`).
- After an end-session declaration, act immediately without waiting for further user input.

## Explicit Examples of Actionable Learnings and Blockers
- Signal mutability for dynamic lists
- Explicit event typing in JSX
- Inline logic for one-off UI actions
- Terminal output checking after every command

## Additional Guidance (from reportedBy: fix-agent.v1)

- **Explicit null/undefined checks:** Always use explicit checks (e.g., `typeof x === 'string'`, `Array.isArray(x)`, `x !== null && x !== undefined`) for all possibly missing or undefined values, especially in callback arguments and when required by strict lint rules. Avoid relying solely on `if (!x)` for validation.
- **Charting library callback types:** When working with charting libraries (e.g., ApexCharts), always specify callback argument types as precisely as possible. Avoid `any`; use the expected object structure or type alias.
- **Troubleshooting strict lint rules:** If lint rules require more explicit null/empty checks than expected, update your code to use the most specific check (e.g., check for both `null` and empty string separately). Example:
  ```ts
  if (value !== null && value !== undefined && value !== '') { /* ... */ }
  ```
- **Output checking and check reruns:** After every fix, always rerun the full check process and check the output until completion, even if the previous error was only a lint warning. Do not stop until "COPILOT: All checks passed!" appears.
- **Checking the latest output file:** In multi-step or long-running sessions, always use the latest output file for checking terminal output, not just the first one, to avoid confusion.

## Output

- Report the final status of the codebase.
- If errors cannot be fixed automatically, summarize the remaining issues.