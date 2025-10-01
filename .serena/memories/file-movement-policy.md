# File Movement Policy

## Critical Rule: Never Leave Empty Files with Comments

**ABSOLUTELY FORBIDDEN:**
- Leaving files with "// This file has been moved to..." comments
- Creating placeholder files after moving content
- Any form of file stub or redirect comments

**CORRECT APPROACH:**
- When moving content from one file to another, DELETE the original file completely
- No comments, no placeholders, no traces
- Clean deletion is the only acceptable approach

## Context
This rule was established after creating a comment placeholder in `src/modules/diet/day-diet/tests/dayDiet.test.ts` instead of properly deleting the file after moving its content to `dayDietOperations.test.ts`.

## Implementation
- Move content to new location
- DELETE original file completely
- No intermediate steps or placeholders