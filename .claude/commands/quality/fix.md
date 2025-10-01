# Quality Fix

Automated codebase checks and fixes until all quality gates pass.

## Usage

```
/fix
```

## Process

1. **Run** `pnpm copilot:check` 
2. **Validate** output for "COPILOT: All checks passed!"
3. **Analyze** error patterns and categorize issues
4. **Fix** automatically (lint, types, tests, imports)
5. **Iterate** until all checks pass

## Fix Categories

**ESLint:** Absolute imports, unused variables, formatting
**TypeScript:** Explicit types, null checks, generic constraints  
**Tests:** Update for code changes, remove orphaned tests
**Architecture:** Layer violations, error handling, import structure

## Output

- ✅ "All checks passed!" - Success
- ❌ "Remaining issues:" - Manual intervention needed
- 🔄 "Iteration [N]:" - Progress during fixes

## Requirements

- `pnpm copilot:check` script available
- Write permissions for auto-fixes
- Git repository for rollback safety