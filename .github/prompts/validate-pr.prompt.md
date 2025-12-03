---
description: Review a GitHub Pull Request (PR) against its referenced issue and acceptance criteria. The prompt takes a PR number (or full PR URL), fetches the PR description and changed files, finds the referenced issue (look for Fixes  or explicit issue link), and performs a focused verification: does the PR implement the issue correctly? Are acceptance criteria met? Are there missing implementations, regressions, or scope creeps? Produce a concise human-readable review report and a machine-friendly checklist and suggestions.
agent: github-issue-manager
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runNotebooks', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'activePullRequest']
---

# PR vs Issue Verification Prompt

Goal
- Given a PR identifier, automatically evaluate whether the PR implements the
  referenced issue and meets its acceptance criteria. Point out missing items,
  acceptance violations, potential regressions, and provide actionable fixes.

Input
- Required: PR identifier (one of: PR number, full PR URL, or "owner/repo#PR").
- Optional: "source" hint (github api, local git, or manual copy) if automatic fetch is not possible.
- Optional: "strictness" level: quick | thorough (default thorough).

Primary steps the assistant must perform
1. Fetch PR metadata:
   - PR title and full description/body.
   - All files changed in the PR, including diffs/patches.
   - Any linked issues mentioned in the PR description (look for "Fixes #<n>", "Closes #<n>", or explicit issue URLs).
   - CI status (if available), existing test results.
2. Identify the referenced issue:
   - If PR body contains "Fixes #<n>" or "Closes #<n>" or an issue URL, open that issue.
   - If multiple issues referenced, list them and prioritize ones marked as "Fixes" or "Closes".
3. Fetch issue content:
   - Title, body, labels, and especially acceptance criteria or checklist items in the issue description.
   - Any related comments that modify or clarify requirements (scan last N comments, N=8).
4. Compare PR changes with issue acceptance criteria:
   - For each acceptance criterion, determine whether the PR:
     - Fully implements it (point to file(s)/diff lines that satisfy it).
     - Partially implements it (explain what's missing).
     - Does not implement it.
   - Detect regressions or unrelated large scope changes (files that don't appear relevant to the issue).
   - Detect potential security or privacy regressions if code touches auth/permissions/data-export.
5. Check documentation and tests:
   - Are tests added/updated for new behavior? Point to test files.
   - Are relevant docs/README/CHANGELOG updated if required by acceptance criteria?
   - Run static checks if available (or recommend commands to run).
6. Produce outputs:
   - A summary verdict (Accept / Needs changes / Reject) and short reason.
   - A checklist mapping each acceptance criterion to status (Done / Partial / Missing) with evidence: file paths, code snippets (small), or diff references.
   - A list of detected issues (bugs, missing tests, missing docs, scope creep, style/format problems).
   - Suggested, prioritized actionable changes (patch-level guidance or sample code).
   - Commands to run locally to reproduce tests/linters and quick steps for the author (e.g., "run: pnpm test -w", "npm run lint", or CI link).
   - If PR description lacks "Fixes #<n>", recommend adding the issue reference and where it should be added.
7. Output formats
   - Primary: human-readable markdown report.
   - Secondary: machine-friendly JSON object at the bottom with keys:
     - pr: { number, title, url }
     - issue: { number, title, url }
     - verdict: Accept|ChangesRequested|Reject
     - acceptanceChecklist: [{ criterion, status, evidence: [{file,line,excerpt}] }]
     - findings: [{ severity, path, message, suggestion }]
     - runCommands: [string]
   - Keep JSON compact and valid for programmatic parsing.

Behavior rules and heuristics
- When matching acceptance criteria to code, prefer exact code references (file + function + line range) over vague statements.
- If acceptance criteria are ambiguous or missing, ask one clarifying question instead of guessing.
- If multiple files implement a feature, ensure they are consistent (no duplicate logic or contradictory behavior).
- If tests fail or CI is red, mark as "Needs changes" and include failing test names and error snippets.
- Flag changes that touch unrelated modules as potential scope creep—explain risk.
- Respect repository conventions (e.g., presence of a testing framework, command names). If unknown, include recommended commands and ask for confirmation.
- Be concise. Produce an executive summary no longer than ~6 sentences, then the detailed checklist and findings.

Formatting requirements
- Start with a one-line summary verdict.
- Then an "Executive summary" (1–4 short paragraphs).
- Then "Acceptance checklist" with bullet items referencing files/line ranges.
- Then "Findings & Recommendations" with prioritized actionable items.
- Close with the compact JSON block suitable for tooling.

Example invocation (user -> assistant)
- "PR: 1438"
- "PR: https://github.com/owner/repo/pull/1438"
- "Please run a thorough review of PR #1438 against its referenced issue."

Example output (outline)
- Verdict line: "Verdict: Needs changes — missing tests for X and acceptance item Y."
- Executive summary.
- Acceptance checklist:
  - [Done] Criterion A — evidence: src/modules/foo/bar.ts:32-54
  - [Partial] Criterion B — evidence: src/modules/foo/baz.ts:12-18, missing: input validation
  - [Missing] Criterion C — not implemented
- Findings & Recommendations (with suggested code changes or tests).
- Run commands.
- JSON blob.

When to ask follow-up questions
- If PR description does not reference an issue explicitly, ask: "Which issue should I validate this PR against?"
- If acceptance criteria are unclear or not present in the issue, ask a clarifying question listing the ambiguous points.
- If the repo requires private access for fetching PR data, ask user to provide PR body and file diffs.

Security & privacy
- Never leak secrets or environment variables.
- If the code touches credentials or tokens, flag it and recommend rotating secrets if necessary.

End of prompt
- Return the full markdown report plus the JSON blob, using the format described above.
