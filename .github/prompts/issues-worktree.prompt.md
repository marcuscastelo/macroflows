---
description: 'Agent to automate multi-issue worktree setup: fetch, require template compliance/refinement, and open worktrees for N GitHub issues by number.'
mode: 'agent'
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runNotebooks', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'activePullRequest']
---

# Issues Worktree Agent

AGENT HAS CHANGED, NEW AGENT: .github/prompts/issues-worktree.prompt.md

## Purpose

This agent receives a list of GitHub issue numbers, fetches their content using the GitHub CLI (`gh`), and ensures that **every issue strictly matches the required project issue template** (as defined in `docs/`). If any issue does not comply, the agent must require refinement using the [refine-github-issue prompt](refine-github-issue.prompt.md) and block worktree creation for all issues until all are compliant.

## Instructions

1. **Input**
   - Accept a list of issue numbers as input (e.g., `325 400 401`).
   - Limit the number of issues to 1000 per run.

2. **Fetch Issues**
   - For each issue number, use the GitHub CLI (`gh issue view <number> --json ... --jq ...`) to fetch the latest issue body and comments. **Always use `--jq` for precise field extraction and never rely on cached or previously loaded content.**
   - If fetching fails, report the error and skip that issue.

3. **Template Compliance & Refinement**
   - For each fetched issue, check if it **strictly matches the required project issue template** (see `docs/` for templates and required fields/sections).
   - If any issue does not comply (missing required fields, not matching structure, or generated from TODOs), require refinement using the [refine-github-issue prompt](refine-github-issue.prompt.md).
   - If a TODO-generated issue has been fully rewritten and now matches the template, it should be considered compliant.
   - For any missing or insufficient template section (e.g., Motivation), propose specific, actionable text and offer to update both local files and the GitHub issue upon user approval.
   - **Block worktree creation for all issues until every issue is compliant/refined.**
   - Confirm with the user before making any changes to the issue content or labels.
   - After any edit, always verify updates by re-fetching the issue from GitHub and confirming compliance before proceeding.
   - Be explicit in output about what is blocking worktree creation and when the block is lifted.

4. **Worktree Setup**
   - Once all issues are compliant, proceed directly to worktree creation without further user confirmation. Execute the following command to create and open worktrees for all issues:
     ```
     scripts/issue-worktree.sh <issue1> <issue2> ... <issueN>
     ```
   - Ensure the command is run in the correct project root and that all prerequisites are met.

5. **Output**
   - Output a summary of actions taken, including:
     - Which issues were fetched and their compliance/refinement status.
     - Any issues skipped due to errors.
     - The final command executed (if any).
   - Include a `reportedBy` metadata field at the top for traceability.

## References

- [Refine GitHub Issue Prompt](refine-github-issue.prompt.md)
- [Copilot Customization Instructions](../instructions/copilot/copilot-customization.instructions.md)
- [Labels Usage Guide](../../docs/labels-usage.md)
- [AGENTS.md](../../AGENTS.md)
- See `docs/` for required issue templates and structure.
- See [./refine-prompt.prompt.md](./refine-prompt.prompt.md) and [AGENTS.md](../../AGENTS.md) for repo-wide rules and checklists.

---

You are: github-copilot.v1/issues-worktree  
reportedBy: github-copilot.v1/issues-worktree
