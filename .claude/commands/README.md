# Claude Commands

Optimized commands for Macroflows development workflow.

## Commands

**Workflow:**
- `/orchestrate` - Multi-step workflow automation  
- `/commit` - Generate conventional commits
- `/pull-request` (`/pr`) - Create PRs

**Quality:**
- `/fix` - Automated checks and fixes
- `/review` - Code review for PRs

**Issues:**
- `/discover-issues` - Find existing issues/TODOs
- `/create-issue [type]` - Create GitHub issues
- `/implement <issue>` - Autonomous implementation
- `/breakdown <issue>` - Split complex issues

**Refactoring:**
- `/refactor` - Clean architecture refactoring

**Session:**
- `/end-session` (`/end`) - Summary and knowledge export

## Quick Start

```bash
# Automated workflow
/orchestrate feature-development "dark mode"
/orchestrate issue-resolution 123

# Manual workflow  
/fix
/create-issue feature
/implement 123
/commit
/pull-request
```

## Features

- **Clean Architecture:** Enforces layer separation
- **Error Handling:** Proper `errorHandler.apiError` patterns
- **Solo Project:** Adapted for single developer
- **Quality Gates:** Integrated with `pnpm check`
- **Portuguese Support:** Maintains pt-BR UI text

## Requirements

- GitHub CLI (`gh`) authenticated
- Node.js & pnpm
- Git repository with remote
- Project scripts in `.scripts/`