# Issue Implementation

Autonomous GitHub issue implementation after plan approval.

## Usage

```
/implement <issue-number>
```

## Process

**Preparation:**
1. Check/create branch: `marcuscastelo/issue<NUMBER>`
2. Retrieve issue data via `gh` CLI
3. Validate issue exists and is implementable

**Planning:**
1. Analyze requirements and acceptance criteria
2. Draft comprehensive implementation plan
3. **Wait for user approval** - execution stops here

**Implementation (Post-Approval):**
1. **Autonomous execution** - no status updates
2. Make all required code changes
3. Fix quality issues automatically
4. Update/rewrite tests as needed
5. Run validation until all pass
6. Commit with conventional messages
7. **Only stops for hard blockers**

## Implementation Types

**Features:** Complete development with UI, domain logic, integration
**Bugs:** Root cause analysis and targeted fixes
**Refactoring:** Code restructuring and architecture alignment
**Improvements:** Technical debt resolution and optimization

## Blockers

**Hard Blockers (Stop and Ask):**
- Ambiguous requirements
- Missing dependencies  
- Breaking changes
- Infrastructure issues

**Soft Blockers (Retry 3x):**
- Test failures
- Lint/type errors
- Build failures
- Validation failures

## Success Criteria

- ✅ All tests pass (`pnpm test`)
- ✅ Type checking passes (`pnpm type-check`) 
- ✅ Linting passes (`pnpm lint`)
- ✅ Build succeeds (`pnpm build`)
- ✅ Quality checks pass (`pnpm check`)
- ✅ All changes committed
- ✅ Clean architecture maintained

## Requirements

- GitHub CLI authenticated
- Git repository with write access
- Node.js and pnpm
- Project scripts available