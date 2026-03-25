---
applyTo: "**"
---
# Copilot Instructions

> Doc status: pointer.
> This file is a Copilot transport pointer, not the source of truth.

Canonical repo policy lives in [../AGENTS.md](../AGENTS.md).

If anything in this file conflicts with `AGENTS.md` or the canonical docs, the canonical docs win.

Prefer Serena MCP whenever it can handle project activation, onboarding, file or symbol work, memory operations, refactors, edits, or shell execution. The brief Serena tool glossary lives in `AGENTS.md`; follow the project naming rules from there at the start of each chat.

## Copilot-specific notes

- Keep the `applyTo` frontmatter so Copilot discovers this file automatically.
- Copilot prompt and agent assets under `.github/prompts/` and `.github/agents/` remain tool-specific supporting material.
- Use the canonical workflow and command defaults from `AGENTS.md`.
