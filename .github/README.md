# GitHub Workspace Assets

> Doc status: supporting.
> This document explains the `.github/` workspace assets. It is not a source of truth; use `../AGENTS.md` and the canonical docs instead.

## Purpose

This directory contains GitHub and Copilot-specific workspace assets used by the Macroflows repository.

## Contents

- `copilot-instructions.md`: Copilot transport pointer that forwards repo-wide policy to `../AGENTS.md`
- `copilot-commit-message-instructions.md`: supporting commit message guidance for Copilot flows
- `COPILOT_SETUP_VALIDATION.md`: supporting snapshot of the Copilot-oriented workspace setup
- `prompts/`: reusable GitHub Copilot prompt files
- `agents/`: reusable custom agent definitions
- `instructions/`: vendor-style scoped instruction files and references
- `workflows/`: GitHub Actions workflows

## Governance

- Repo-wide policy is canonical in `../AGENTS.md`.
- Tool-specific files under `.github/` must not redefine canonical repo policy.
- If a `.github/` asset references global rules, it should point to `../AGENTS.md` and the canonical docs rather than owning those rules itself.
