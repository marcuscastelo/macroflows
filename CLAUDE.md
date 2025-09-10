# CLAUDE.md

Macroflows nutrition tracking platform: SolidJS, TypeScript, Supabase. Domain-driven design with layered architecture. Solo project by marcuscastelo.

## Frontend Simplicity Principles - CRITICAL

**🚨 FRONTEND APP - NOT A LIBRARY**

**Never Add:**
- Custom error classes (use `Error()` + Zod)
- Abstract base classes (unless 3+ implementations)  
- Domain-specific exceptions (use descriptive messages)
- Complex hierarchies (prefer composition)
- Enterprise patterns (solo project - keep simple)

**Before Adding Abstractions:**
- Will this have 3+ implementations?
- Does this solve an actual problem?
- Is platform functionality insufficient?
- Will this reduce total code lines?

**Golden Rule:** Name 3 concrete implementations or don't create it.

## Speed Over Complexity

**Never Add:**
- Backward compatibility (Vercel rollback exists)
- Feature flags (implement directly)
- A/B testing infrastructure (manual testing sufficient)
- Fallback mechanisms (trust implementation)
- Migration strategies (direct replacement)
- Enterprise rollout plans (solo project)

**Decision Framework:**
- Can we build directly without scaffolding?
- Are we using database/framework optimally?
- Can we delete complexity instead of adding?
- Should this live in PostgreSQL vs TypeScript?

**Logic Placement (Preferred Order):**
1. PostgreSQL functions (search, data processing)
2. Domain layer (business logic, validations)
3. Application layer (SolidJS orchestration, error handling)
4. Infrastructure layer (external APIs)

**Example:**
```typescript
// ❌ Complex: Client normalization + server merging + DB queries
// ✅ Simple: PostgreSQL function + single RPC call
```

**Implementation Patterns:**
- Complex logic → PostgreSQL functions  
- Orchestration → TypeScript application layer
- UI state → SolidJS signals/effects
- Validation → Zod schemas

**Testing:**
```typescript
// ❌ Testing TypeScript guarantees
// ✅ Testing behavior that matters
test('calls correct search function', () => {
  expect(deps.fetchFoodsByName).toHaveBeenCalledWith(search, { limit: 50 })
})
```

**Complexity Checklist:**
- Does platform already solve this?
- Solving real problem vs theoretical?
- Will this reduce total lines?

**Choose Simple:**
- Single RPC call vs client orchestration
- Standard Error() vs custom hierarchies  
- PostgreSQL vs client logic
- Zod vs manual validation

## Commands & Setup

**Environment:** Use pnpm (10.12.1+)

**🚨 CRITICAL: Always run `pnpm check` before declaring complete**

**Commands:**
- `pnpm check` - MANDATORY quality gate (lint, type-check, test)
- `pnpm fix` - Auto-fix ESLint issues
- `pnpm build/test/lint` - Individual checks

**Claude Commands:** See `.claude/commands/` directory

**Workflow:**
- `/fix` - Automated checks and fixes  
- `/commit` - Generate conventional commits
- `/pull-request` - Create PRs
- `/implement <issue>` - Full issue implementation

## Architecture

**3-Layer Domain-Driven Design:**

**Domain** (`modules/*/domain/`):
- Pure business logic, Zod schemas
- Never import errorHandler or side effects
- Throw standard `Error()` with context

**Application** (`modules/*/application/`):
- SolidJS orchestration, error handling
- Must catch errors and call `errorHandler.apiError`
- Global reactive state with signals/effects

**Infrastructure** (`modules/*/infrastructure/`):
- Supabase repositories, external APIs
- Only layer allowed `any` types for external APIs

## Error Handling

**Domain Layer:** Standard `Error()` + Zod validation
**Application Layer:** Always catch and call `errorHandler.apiError`

**Required Context:** `component`, `operation`, `additionalData`

**Avoid:** Custom error classes, domain-specific types, instanceof checks

## Component Patterns

**Fire-and-Forget:** Use `void` only in event handlers with application-layer error handling

**Compound Components:** `Modal.Header = ModalHeader`

**Global State:** Prefer signals over prop drilling, use context for scoped state

## Testing

**Trust TypeScript:** Don't test what compiler guarantees
**Focus on Behavior:** Test business logic, calculations, integrations
**Avoid Redundancy:** No type validation tests if TypeScript enforces

**Setup:** Vitest + jsdom, tests in `tests/` folder, update when code changes

## Code Style

**Imports:** Always absolute with `~/` prefix, no barrel files, static only
**Language:** English code/comments, Portuguese UI text allowed
**Types:** Never `any` (except infrastructure), prefer type aliases, use Zod
**Naming:** Descriptive action-based names, avoid generic utils.ts
**CSS:** Always use `cn()` for Tailwind class merging

## File Organization

```
src/
├── modules/           # Domain modules (diet, user, etc.)
│   └── domain/application/infrastructure/ui/tests/
├── sections/          # Page-level UI (common/, day-diet/, etc.)
├── routes/           # SolidJS pages and API endpoints
├── shared/           # Cross-cutting utilities
└── assets/           # Static assets
```

**Rules:** Domain modules follow clean architecture, sections for UI, shared utilities framework-agnostic

## Workflow Standards

**Pre-Commit:** Always run `pnpm check` - MUST PASS before completion
**Refactoring:** Measure with `git diff --stat`, preserve functionality, incremental changes
**Commits:** Conventional format, English only, NEVER include "Generated with Claude Code"
**JSDoc:** Update for exported functions only, English, remove outdated
**TODOs:** Never remove TODO comments
**Console:** BANNED - use `devConsole`, `errorHandler.apiError`, `logToBreadcrumb`
**Solo Project:** No team coordination, focus on technical validation

## Tech Stack

**Frontend:** SolidJS, TypeScript, TailwindCSS, DaisyUI
**Backend:** Supabase (PostgreSQL + Realtime)
**Validation:** Zod schemas
**Testing:** Vitest + jsdom
**Build:** Vinxi (Vite-based)

**Key Dependencies:** @solidjs/start, @supabase/supabase-js, solid-toast, html5-qrcode, dayjs, axios

## Search Features

**Portuguese Support:** All search must be diacritic-insensitive and case-insensitive
**Use:** `removeDiacritics` utility for text normalization

## Memory Bank

- NEVER destructure `props` (breaks reactivity)
- "Fix tests" = adjust test structure only, not production code
- DELETE moved files completely after content transfer