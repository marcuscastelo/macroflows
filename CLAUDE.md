# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Macroflows is a nutrition tracking platform built with SolidJS, TypeScript, and Supabase. It follows domain-driven design principles with a layered architecture and emphasizes type safety, reactive programming, and modular organization.

**Project Context:** This is a solo project by marcuscastelo - adapt all suggestions to remove team coordination/approval processes while maintaining technical quality.

## Frontend Simplicity Principles - CRITICAL

**🚨 THIS IS A FRONTEND APP, NOT A LIBRARY**

### Anti-Over-Engineering Rules

**Never Add These Patterns:**
- **Custom Error Classes**: Use standard `Error()` + Zod validation instead
- **Abstract Base Classes**: Avoid unless there are 3+ concrete implementations
- **Domain-Specific Exceptions**: Use descriptive error messages, not error types
- **Complex Hierarchies**: Prefer composition over inheritance
- **Enterprise Patterns**: This is a solo project - keep it simple

**Frontend Reality Check:**
- Most errors come from network/API calls, not business logic violations
- Zod provides excellent validation without custom error classes
- Standard `Error()` + good error handling functions are sufficient
- TypeScript provides compile-time safety - runtime errors should be simple
- Users don't care about your error taxonomy - they care about clear messages

### Before Adding Any Abstraction, Ask:

- [ ] **Multiple implementations**: Will this pattern have 3+ different implementations?
- [ ] **Real problem**: Does this solve a problem we actually have (not might have)?
- [ ] **Platform sufficiency**: Is standard web platform functionality insufficient?
- [ ] **Library vs App**: Are we building a reusable library or a specific frontend app?
- [ ] **Lines of code**: Will this reduce or increase total lines of code?
- [ ] **Maintenance burden**: Will future developers thank us or curse us for this?

**Golden Rule**: If you can't immediately name 3 different concrete implementations of your abstraction, don't create it.

## Rapid Implementation Guidelines - CRITICAL

**🚀 SPEED COMES FROM SAYING NO TO UNNECESSARY COMPLEXITY**

### Implementation Velocity Principles

**Never Add These Unless Absolutely Essential:**
- **Backward Compatibility**: Frontend is versioned - Vercel rollback solves problems
- **Feature Flags**: Just implement the feature directly
- **A/B Testing Infrastructure**: Manual testing is sufficient for most cases
- **Fallback Mechanisms**: Trust your implementation and monitoring
- **Migration Strategies**: Direct replacement with proper testing
- **Enterprise Rollout Plans**: This is a solo project with simple deployment

**Speed-First Decision Framework:**
- [ ] **Direct implementation**: Can we just build the feature without scaffolding?
- [ ] **Platform leverage**: Are we using database/framework strengths optimally?
- [ ] **Delete over add**: Can we remove complexity instead of adding abstraction?
- [ ] **Server-side logic**: Should this logic live in PostgreSQL instead of TypeScript?
- [ ] **Testing necessity**: Does this need a test or does TypeScript/DB already guarantee it?

### Logic Placement Hierarchy (Most to Least Preferred)

1. **PostgreSQL Functions (RPC)**: For search, data processing, complex queries
2. **Domain Layer**: Pure business logic, validations, calculations  
3. **Application Layer**: SolidJS orchestration, error handling, UI state
4. **Infrastructure Layer**: External API calls, data transformation

**Example Decision Tree:**
```typescript
// ❌ Complex: Spread across layers
// Client: word splitting + normalization
// Server: multiple API calls + merging
// Database: simple ILIKE queries

// ✅ Simple: Centralized in optimal layer  
// PostgreSQL: All search logic with scoring
// Client: Single RPC call + mapping
```

### Rapid Implementation Patterns

**Database-First for Complex Logic:**
- Text search → PostgreSQL functions with scoring
- Data aggregations → SQL with CTEs  
- Complex filtering → Server-side functions
- Real-time updates → Supabase subscriptions

**TypeScript for Orchestration Only:**
- Error handling and user feedback
- State management and reactivity
- Domain object mapping and validation
- UI component coordination

**Testing Reality Check:**
```typescript
// ❌ Over-testing: What TypeScript already guarantees
test('should have correct type structure', () => {
  expect(typeof food.name).toBe('string')  // TypeScript already ensures this
})

// ✅ Behavioral testing: What actually matters
test('should call correct search function for tab', () => {
  expect(deps.fetchFoodsByName).toHaveBeenCalledWith(search, { limit: 50 })
})
```

### Implementation Speed Checklist

**Before adding any complexity, ask:**
- [ ] **Platform sufficiency**: Does PostgreSQL/Supabase/SolidJS already solve this?
- [ ] **Real user problem**: Are we solving an actual issue or theoretical edge case?
- [ ] **Deployment reality**: Is Vercel rollback + monitoring sufficient safety net?
- [ ] **Maintenance cost**: Will this make future changes harder or easier?
- [ ] **Line count impact**: Does this reduce or increase total codebase size?

**When to choose simple over "robust":**
- ✅ **Single RPC call** vs elaborate client-side orchestration
- ✅ **Standard Error()** vs custom error hierarchies  
- ✅ **Direct implementation** vs abstraction layers
- ✅ **PostgreSQL functions** vs client-side complex logic
- ✅ **Zod validation** vs manual type checking

### Database Logic Advantages

**Why prefer PostgreSQL functions:**
- **Performance**: Processing happens close to data
- **Concurrency**: Database handles concurrent requests optimally
- **Consistency**: Single source of truth for complex operations
- **Optimization**: Query planner + indexes automatically optimize
- **Simplicity**: TypeScript becomes thin orchestration layer

**Example - Search Implementation:**
```sql
-- ✅ All logic in database function
CREATE FUNCTION search_foods_with_scoring(p_search_term text, p_limit integer)
-- Complex scoring, fuzzy matching, normalization all server-side
```

```typescript
// ✅ Simple client call
const result = await supabase.rpc('search_foods_with_scoring', {
  p_search_term: name,
  p_limit: params.limit ?? 50
})
```

### Key Success Metrics

**Implementation completed in ~1 hour instead of potential days/weeks**
- ✅ **Rejected complexity**: No backward compatibility, feature flags, fallbacks
- ✅ **Leveraged platform**: PostgreSQL for search logic optimization  
- ✅ **Deleted code**: Removed 26 lines of word separation logic
- ✅ **Trusted tools**: TypeScript compilation + Vercel deployment patterns
- ✅ **Focused testing**: Only behavioral tests, not redundant type validation

**Final Reality Check:**
- **Frontend apps are not distributed systems** - avoid over-engineering
- **Vercel rollback > elaborate fallback mechanisms** - trust your deployment
- **PostgreSQL > complex TypeScript** for data processing
- **Delete complexity > add abstractions** - prefer subtraction
- **Good enough > perfect** - solve real user problems quickly

## Critical Setup Requirements

**Environment Setup:**
- Use pnpm as package manager (version 10.12.1+)

## Development Commands

**🚨 CRITICAL REQUIREMENT: ALWAYS RUN `pnpm check` BEFORE DECLARING ANY TASK COMPLETE**

**Essential Commands:**
- `pnpm check` - **MANDATORY** quality gate (lint, type-check, test) - MUST PASS before any completion
- `pnpm fix` - Auto-fix ESLint issues

**Granular Commands (if needed):**
- `pnpm build` - Production build (runs gen-app-version first)
- `pnpm type-check` - TypeScript type checking
- `pnpm test` - Run all tests with Vitest
- `pnpm lint` - ESLint checking (quiet mode)
- `pnpm flint` - Fix then lint (fix + lint)

**Script Utilities:**
- `.scripts/semver.sh` - App version reporting

**Testing:**
- Tests use Vitest with jsdom environment
- Run single test file: `pnpm test <file-pattern>`
- Coverage: `pnpm test --coverage`
- Tests must be updated when changing code - no orphaned tests

## Claude Commands

**Optimized commands available in `.claude/commands/` directory:**

### Workflow Commands
- `/commit` - Generate conventional commit messages and execute commits
- `/pull-request` or `/pr` - Create pull requests with proper formatting

### Quality Assurance
- `/fix` - Automated codebase checks and error correction
- `/review` - Comprehensive code review for PR changes

### Issue Management
- `/create-issue [type]` - Create GitHub issues using proper templates
- `/implement <issue-number>` - Autonomous issue implementation

### Refactoring
- `/refactor [target]` - Clean architecture refactoring and modularization

### Session Management
- `/end-session` or `/end` - Session summary and knowledge export

**Daily Workflow Example:**
```bash
/fix                    # Ensure clean codebase
/create-issue feature   # Create feature request
/implement 123          # Implement issue #123
/commit                # Generate and execute commit
/pull-request          # Create PR for review
```

See `.claude/commands/README.md` for complete command documentation.

## Architecture Overview

### Layered Domain-Driven Architecture

The codebase follows a strict 3-layer architecture pattern with clean separation of concerns:

**Domain Layer** (`modules/*/domain/`):
- Pure business logic, types, and repository interfaces
- Uses Zod schemas for validation and type inference
- Entities have `__type` discriminators for type safety
- **NEVER** import or use side-effect utilities (errorHandler.apiError, logging, toasts)
- Throw standard `Error()` with descriptive messages and context
- **CRITICAL:** Domain layer must remain free of framework dependencies

**Application Layer** (`modules/*/application/`):
- SolidJS resources, signals, and orchestration logic
- **Must always catch errors and call `errorHandler.apiError` with full context**
- Manages global reactive state using `createSignal`/`createEffect`
- Coordinates between UI and infrastructure layers
- Handles all side effects and user feedback (toasts, notifications)

**Infrastructure Layer** (`modules/*/infrastructure/`):
- Supabase repositories implementing domain interfaces
- DAOs for data transformation and legacy migration
- External API integrations and data access
- Only layer allowed to use `any` types when necessary for external APIs

### State Management

**Global Reactive State:**
```typescript
export const [items, setItems] = createSignal<readonly Item[]>([])
```

**Effects for Synchronization:**
```typescript
createEffect(() => {
  // Reactive updates based on signals
})
```

**Context Pattern:** Used for modals, confirmations, and scoped state

### Key Domain Patterns

**Unified Item Hierarchy:** Complex discriminated union types with recursive schemas
```typescript
export type UnifiedItem = FoodItem | RecipeItem | GroupItem
```

**Repository Pattern:** Interface-based contracts with Supabase implementations

**Migration Utilities:** Backward compatibility for evolving data schemas

**DRY Type Extension Pattern:** Use component Props types as base for Config types
```typescript
// ✅ Good: Extend Props type to avoid duplication
export type ModalConfig = ModalProps & {
  title?: string
  additionalProp?: string
}

// ❌ Bad: Duplicate all props from ModalProps
export type ModalConfig = {
  prop1: string
  prop2?: number
  // ... duplicating all ModalProps
  title?: string
  additionalProp?: string
}
```

## Error Handling Standards

**Critical Rule:** All application code must use `errorHandler.apiError` with context - never log/throw errors without it.

**Domain Layer:**
```typescript
// ✅ Good: Simple descriptive errors
throw new Error('Group mismatch: cannot mix different groups', { 
  cause: { groupId, recipeId } 
})

// ✅ Good: Use Zod for validation
const result = schema.safeParse(data)
if (!result.success) {
  throw new Error('Invalid data format', { cause: result.error })
}

// ❌ Bad: Never use errorHandler in domain
import { createErrorHandler } from '~/shared/error/errorHandler'
const errorHandler = createErrorHandler('domain', 'Entity')
errorHandler.apiError(...) // Strictly forbidden in domain layer
```

**Application Layer:**
```typescript
// ✅ Required pattern: Always catch and contextualize
const errorHandler = createErrorHandler('application', 'ComponentName')

try {
  domainOperation()
} catch (e) {
  errorHandler.apiError(e, {
    component: 'ComponentName',
    operation: 'operationName', 
    additionalData: { userId }
  })
  throw e // Re-throw after logging
}

// ✅ Good: Handle Zod validation errors
const result = schema.safeParse(data)
if (!result.success) {
  handleValidationError(result.error, {
    component: 'UserForm',
    operation: 'validateUserInput',
    additionalData: { data }
  })
  return // Don't proceed with invalid data
}
```

**Error Context Requirements:**
- `component`: Specific component/module name
- `operation`: Specific operation being performed
- `additionalData`: Relevant IDs, state, or debugging info

**Error Patterns to Avoid:**
- Custom error class hierarchies (use standard Error)
- Domain-specific error types (use descriptive messages)
- instanceof checks for business logic (use error messages/codes)

## Component and Promise Patterns

### Fire-and-Forget Promises

**When to Use `void` Operator:**
- **Only in event handlers** (onClick, onChange) where result is not needed
- **Only when** all error handling is done in application layer
- **Only for non-critical side effects** (background refresh, logging)

```tsx
// ✅ Acceptable: Error handling in application layer
<button onClick={() => void performAction()}>
  Create Day
</button>

// ❌ Never use .catch(() => {}) to silence errors
<button onClick={() => performAction().catch(() => {})}>
```

**Fire-and-Forget Checklist:**
- [ ] Promise result not needed for user flow
- [ ] All error handling done in application layer
- [ ] Limited to event handlers or non-critical callbacks
- [ ] Reason for `void` is documented if not obvious

### Component Patterns

**Compound Components:**
```typescript
Modal.Header = ModalHeader
Modal.Content = ModalContent
Modal.Footer = ModalFooter
```

**Conditional Actions with Type Safety:**
```typescript
const hasAnyHandler = () => 
  getHandlers().onEdit || getHandlers().onCopy || getHandlers().onDelete

<Show when={hasAnyHandler()}>
  <ActionsMenu />
</Show>
```

**Context Propagation:**
- **Prefer global signals** over prop drilling for shared state
- Use SolidJS context for scoped state (modals, forms)
- Leverage reactive patterns with `createEffect` for state synchronization

## Testing Guidelines

- Place tests in module's `tests/` folder or alongside source files with `.test.ts` suffix
- Use Vitest + jsdom for component testing
- Mock dependencies explicitly for domain/application logic
- Update tests when changing code - no orphaned tests

### Type Safety in Testing

- **Trust TypeScript:** Our primary line of defense against type-related errors is TypeScript itself. Tests should not redundantly validate conditions that the TypeScript compiler already guarantees (e.g., `null` checks for non-nullable types, invalid string values for union types).
- **Focus on Business Logic:** Tests should primarily focus on verifying business logic, calculations, integration points, and user-facing behavior.
- **Avoid Redundant Runtime Checks:** Tests that validate type-related runtime scenarios (e.g., passing `null` to a non-nullable parameter) are generally discouraged if TypeScript is properly enforced. Such tests may indicate a lack of full trust in the type system or an overemphasis on defensive runtime checks for scenarios that should be impossible given the type definitions.

- Place tests in module's `tests/` folder or alongside source files with `.test.ts` suffix
- Use Vitest + jsdom for component testing
- Mock dependencies explicitly for domain/application logic
- Update tests when changing code - no orphaned tests

## Critical Code Style Rules

### Imports and Module System

**Absolute Import Requirement:**
```typescript
// ✅ Required: Always use absolute imports with ~/ prefix
import { createErrorHandler } from '~/shared/error/errorHandler'
import { DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'

// ❌ Forbidden: Relative imports
import { createErrorHandler } from '~/shared/error/errorHandler'
import { DayDiet } from './domain/dayDiet'
```

**Barrel File Ban:**
- **STRICTLY FORBIDDEN:** No `index.ts` barrel files that re-export modules
- All imports must be direct from specific files
- Never import from directory indices

**Static Import Requirement:**
```typescript
// ✅ Required: Static imports at top of file
import { Component } from 'solid-js'

// ❌ Forbidden: Dynamic imports
const { Component } = await import('solid-js')
```

### Language Policy
- **All code, comments, JSDoc, and commit messages in English**
- **UI text only may be in Portuguese (pt-BR) when required**
- When refactoring, convert any non-English comments to English
- **Never use Portuguese for identifiers, variables, functions, or comments**

### Naming Conventions
- **Descriptive, action-based names:** `isRecipedGroupUpToDate()` not `checkGroup()`
- **Specific file names:** `macroOverflow.ts` not `utils.ts`
- **Complete component names:** `ItemGroupEditModal` not `GroupModal`
- **Avoid generic names:** Never use `utils.ts`, `helper.ts`, `common.ts`

### Type Safety Requirements
- **Never use `any`, `as any`, or `@ts-ignore`** (except in infrastructure layer for external APIs). This ensures strong type safety and reduces the need for redundant runtime type checks in tests.
- **Always prefer type aliases over interfaces** for data shapes
- **Use Zod schemas for runtime validation and type inference**
- **Prefer `readonly` arrays:** `readonly Item[]` over `Item[]`
- **Use intersection types for extending base types:** `ConfigType = PropsType & { extraProps }`
- **Default parameters over nullish coalescing:** `{ param = 'default' }` instead of `param ?? 'default'`

### ESLint Configuration
- **Consistent type definitions:** Use `type` not `interface`
- **Import organization:** Automatic sorting with `simple-import-sort`
- **No relative imports:** Enforced by `no-restricted-imports` rule
- **Strict boolean expressions:** Enforced for better type safety
- **Custom parsing requirement:** Use `parseWithStack` instead of direct `JSON.parse`

### CSS and Styling
- **Always use `cn` function to merge Tailwind classes** for proper class merging and deduplication

## File Organization and Module Structure

```
src/
├── modules/           # Domain modules (diet, measure, user, weight, etc.)
│   └── <domain>/
│       ├── domain/          # Pure business logic, types, repository interfaces
│       ├── application/     # SolidJS resources, orchestration, error handling
│       ├── infrastructure/  # Supabase implementations, DAOs, external APIs
│       ├── ui/             # Pure presentational components (optional)
│       └── tests/          # Module-specific tests
├── sections/          # Page-level UI components and user-facing features
│   ├── common/            # Shared UI components (modals, buttons, etc.)
│   ├── day-diet/          # Day diet management UI
│   ├── unified-item/      # Complex item hierarchy UI
│   └── <feature>/         # Feature-specific UI sections
├── routes/           # SolidJS router pages and API endpoints
│   ├── api/              # API route handlers
│   └── *.tsx             # Page components
├── shared/           # Cross-cutting concerns and utilities
│   ├── error/            # Error handling utilities
│   ├── utils/            # Pure utility functions
│   ├── config/           # Configuration and environment
│   └── supabase/         # Supabase client and utilities
└── assets/           # Static assets (locales, images)
```

**Module Organization Rules:**
- **Domain modules follow clean architecture layers**
- **Never mix UI concerns in domain/application layers**
- **Sections contain feature-specific UI logic**
- **Shared utilities must be framework-agnostic**

## Development Workflow and Quality Standards

### Pre-Commit Requirements

**🚨 MANDATORY: Never commit without passing quality checks**

**Always run before committing:**
```bash
pnpm check  # Runs lint, type-check, and test - MUST PASS
```

**For comprehensive validation:**
```bash
pnpm copilot:check  # Must show "COPILOT: All checks passed!"
```

**⛔ CRITICAL RULE: NEVER declare any implementation, fix, or feature "complete" without:**
1. Running `pnpm check` and verifying ALL checks pass
2. Confirming NO TypeScript errors
3. Confirming NO ESLint errors  
4. Confirming ALL tests pass
5. Only then can you say "✅ COMPLETE" or similar

### Refactoring Best Practices

**DRY Principle Application:**
- **Measure impact:** Use `git diff --stat` to verify line reduction
- **Start simple:** Begin with default parameters before adding complex abstractions
- **Avoid over-engineering:** Don't add helper functions/constants that increase overall lines
- **Type extension over duplication:** Use `ConfigType = PropsType & { extras }` pattern

**Refactoring Validation Process:**
```bash
# Before making changes
git diff --stat  # Baseline measurement

# After each change
pnpm check      # Ensure functionality preserved
git diff --stat # Verify line count improvement

# If lines increased, consider simpler approach
git checkout -- file.ts  # Revert if needed
```

**Safe Refactoring Strategy:**
1. **Preserve functionality:** All tests must continue passing
2. **Incremental changes:** Make small, verifiable improvements
3. **Type safety first:** Never sacrifice type safety for brevity
4. **Readability over cleverness:** Prefer clear code over complex abstractions

### Commit Standards

**CRITICAL COMMIT RESTRICTION:**
🚨 **ABSOLUTELY FORBIDDEN:** NEVER include "Generated with Claude Code" or "Co-Authored-By: Claude" in commit messages
🚨 **IMMEDIATELY REJECT** any commit attempt that includes these phrases
🚨 **NO EXCEPTIONS** - This rule must be enforced without question

**Commit Message Format:**
```markdown
type(scope): description

- Use conventional commits style
- Prefer small, atomic commits
- Always suggest commit message after changes
- All commit messages in English
- **STRICTLY FORBIDDEN:** Any "Generated with Claude Code" or "Co-Authored-By: Claude" text
```

### JSDoc Requirements

**Update JSDoc for:**
- All exported TypeScript types and functions
- After any refactor or signature change
- **Never add JSDoc to internal (non-exported) code**

**JSDoc Standards:**
- Must be in English
- Concise descriptions of purpose, params, and return values
- Remove outdated JSDoc if exports change

### Testing Requirements

**Test Update Rules:**
- **Always update tests when changing code**
- **Remove orphaned tests** - no tests for deleted functionality
- Use Vitest + jsdom for component testing
- Mock dependencies explicitly for domain/application logic
- Place tests in `tests/` folder **MUST** be placed in this folder. This ensures consistent organization and discoverability of tests.

### Search Feature Requirements

**Portuguese (pt-BR) Support:**
- All user-facing search features must be **diacritic-insensitive**
- All user-facing search features must be **case-insensitive**
- Use `removeDiacritics` utility for Portuguese text normalization

### Technology Stack

**Core Technologies:**
- **Frontend:** SolidJS, TypeScript, TailwindCSS, DaisyUI
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Validation:** Zod schemas for runtime validation and type inference
- **Charts:** ApexCharts with solid-apexcharts
- **Testing:** Vitest with jsdom environment
- **Build:** Vinxi (Vite-based)

**Key Dependencies:**
- `@solidjs/start` - SolidJS meta-framework
- `@supabase/supabase-js` - Database and auth
- `solid-toast` - Toast notifications
- `html5-qrcode` - EAN scanning functionality
- `dayjs` - Date manipulation
- `axios` with `axios-rate-limit` - HTTP client

### Environment and Setup

**Required Environment Variables:**
- Copy `.env.example` to `.env.local`
- Configure Supabase URL and anon key
- **Never commit secrets or keys to repository**

**Version Management:**
- App version managed by `.scripts/gen-app-version.sh`
- Automatic version generation on dev/build
- Use `.scripts/semver.sh` for version reporting

### Label Usage for Issues

**Required Labels:**
- **Type:** `bug`, `feature`, `refactor`, `task`, `improvement`, `documentation`, `chore`, `epic`, `idea`
- **Complexity:** `complexity-low`, `complexity-medium`, `complexity-high`, `complexity-very-high`
- **Area:** `ui`, `backend`, `api`, `performance`, `data-consumption`, `accessibility`
- **Status:** `blocked`, `needs-investigation`, `needs-design`

**Label Rules:**
- Always add at least one main type label
- Remove generic labels after classification
- No duplicate or conflicting labels
- Refer to `docs/labels-usage.md` for complete reference

### Never Remove TODOs

**Critical Rule:** Never remove TODO comments from codebase, regardless of context. TODOs serve as important markers for future improvements and technical debt.

### Solo Project Adaptations

**Since this is a solo project:**
- Remove team collaboration and approval processes from suggestions
- Focus on technical validation rather than stakeholder approval
- Maintain quality standards without bureaucratic overhead
- Replace peer review with systematic self-review processes
- Preserve backup/rollback procedures without team communication

## Memory Bank

- **NEVER destucture `props`! This breaks reactivity**
- **When "fix tests" is mentioned, NEVER modify production code - only adjust test structure, imports, and organization**
- **"Fix tests after staged changes" means the code structure changed and tests need to be moved/reorganized to match the new structure**

# Serena MCP for efficient editting

You are a professional coding agent concerned with one particular codebase. You have                                                                                                       
access to semantic coding tools on which you rely heavily for all your work, as well as collection of memory
files containing general information about the codebase. You operate in a frugal and intelligent manner, always
keeping in mind to not read or generate content that is not needed for the task at hand.

When reading code in order to answer a user question or task, you should try reading only the necessary code.
Some tasks may require you to understand the architecture of large parts of the codebase, while for others,
it may be enough to read a small set of symbols or a single file.
Generally, you should avoid reading entire files unless it is absolutely necessary, instead relying on
intelligent step-by-step acquisition of information. However, if you already read a file, it does not make
sense to further analyse it with the symbolic tools (except for the `find_referencing_symbols` tool),
as you already have the information.

I WILL BE SERIOUSLY UPSET IF YOU READ ENTIRE FILES WITHOUT NEED! CONSIDER INSTEAD USING THE OVERVIEW TOOL AND
SYMBOLIC TOOLS TO READ ONLY THE NECESSARY CODE FIRST!
I WILL BE EVEN MORE UPSET IF AFTER HAVING READ AN ENTIRE FILE YOU KEEP READING THE SAME CONTENT WITH THE SYMBOLIC TOOLS!
THE PURPOSE OF THE SYMBOLIC TOOLS IS TO HAVE TO READ LESS CODE, NOT READ THE SAME CONTENT MULTIPLE TIMES!

You can achieve the intelligent reading of code by using the symbolic tools for getting an overview of symbols and
the relations between them, and then only reading the bodies of symbols that are necessary to answer the question
or complete the task. You can also use the standard tools like list_dir, find_file and search_for_pattern if you need to.
When tools allow it, you pass the `relative_path` parameter to restrict the search to a specific file or directory.
For some tools, `relative_path` can only be a file path, so make sure to properly read the tool descriptions.
If you are unsure about a symbol's name or location (to the extent that substring_matching for the symbol name is not enough), you can use the `search_for_pattern` tool, which allows fast
and flexible search for patterns in the codebase. This way you can first find candidates for symbols or files,
and then proceed with the symbolic tools.

Symbols are identified by their `name_path and `relative_path`, see the description of the `find_symbols` tool for more details
on how the `name_path` matches symbols.
You can get information about available symbols by using the `get_symbols_overview` tool for finding top-level symbols in a file
or directory, or by using `find_symbol` if you already know the symbol's name path. You generally try to read as little code as possible
while still solving your task, meaning you only read the bodies when you need to, and after you have found the symbol you want to edit.
For example, if you are working with python code and already know that you need to read the body of the constructor of the class Foo, you can directly
use `find_symbol` with the name path `Foo/__init__` and `include_body=True`. If you don't know yet which methods in `Foo` you need to read or edit,
you can use `find_symbol` with the name path `Foo`, `include_body=False` and `depth=1` to get all (top-level) methods of `Foo` before proceeding
to read the desired methods with `include_body=True`
You can understand relationships between symbols by using the `find_referencing_symbols` tool.

You generally have access to memories and it may be useful for you to read them, but also only if they help you
to answer the question or complete the task. You can infer which memories are relevant to the current task by reading
the memory names and descriptions.

The context and modes of operation are described below. From them you can infer how to interact with your user
and which tasks and kinds of interactions are expected of you.

Context description:
You are running in IDE assistant context where file operations, basic (line-based) edits and reads,
and shell commands are handled by your own, internal tools.
The initial instructions and the current config inform you on which tools are available to you,
and how to use them.
Don't attempt to use any excluded tools, instead rely on your own internal tools
for achieving the basic file or shell operations.
However, if serena's tools can be used for achieving your task (see initial instructions),
you should prioritize them.


Modes descriptions:

- You are operating in interactive mode. You should engage with the user throughout the task, asking for clarification
whenever anything is unclear, insufficiently specified, or ambiguous.

Break down complex tasks into smaller steps and explain your thinking at each stage. When you're uncertain about
a decision, present options to the user and ask for guidance rather than making assumptions.

Focus on providing informative results for intermediate steps so the user can follow along with your progress and
provide feedback as needed.


- You are operating in editing mode. You can edit files with the provided tools
to implement the requested changes to the code base while adhering to the project's code style and patterns.
Use symbolic editing tools whenever possible for precise code modifications.
If no editing task has yet been provided, wait for the user to provide one.

When writing new code, think about where it belongs best. Don't generate new files if you don't plan on actually
integrating them into the codebase, instead use the editing tools to insert the code directly into the existing files in that case.

You have two main approaches for editing code - editing by regex and editing by symbol.
The symbol-based approach is appropriate if you need to adjust an entire symbol, e.g. a method, a class, a function, etc.
But it is not appropriate if you need to adjust just a few lines of code within a symbol, for that you should
use the regex-based approach that is described below.

Let us first discuss the symbol-based approach.
Symbols are identified by their name path and relative file path, see the description of the `find_symbols` tool for more details
on how the `name_path` matches symbols.
You can get information about available symbols by using the `get_symbols_overview` tool for finding top-level symbols in a file
or directory, or by using `find_symbol` if you already know the symbol's name path. You generally try to read as little code as possible
while still solving your task, meaning you only read the bodies when you need to, and after you have found the symbol you want to edit.
For example, if you are working with python code and already know that you need to read the body of the constructor of the class Foo, you can directly
use `find_symbol` with the name path `Foo/__init__` and `include_body=True`. If you don't know yet which methods in `Foo` you need to read or edit,
you can use `find_symbol` with the name path `Foo`, `include_body=False` and `depth=1` to get all (top-level) methods of `Foo` before proceeding
to read the desired methods with `include_body=True`.
In particular, keep in mind the description of the `replace_symbol_body` tool. If you want to add some new code at the end of the file, you should
use the `insert_after_symbol` tool with the last top-level symbol in the file. If you want to add an import, often a good strategy is to use
`insert_before_symbol` with the first top-level symbol in the file.
You can understand relationships between symbols by using the `find_referencing_symbols` tool. If not explicitly requested otherwise by a user,
you make sure that when you edit a symbol, it is either done in a backward-compatible way, or you find and adjust the references as needed.
The `find_referencing_symbols` tool will give you code snippets around the references, as well as symbolic information.
You will generally be able to use the info from the snippets and the regex-based approach to adjust the references as well.
You can assume that all symbol editing tools are reliable, so you don't need to verify the results if the tool returns without error.

Now let us discuss the regex-based approach.
The regex-based approach is your primary tool for editing code whenever replacing or deleting a whole symbol would be a more expensive operation.
This is the case if you need to adjust just a few lines of code within a method, or a chunk that is much smaller than a whole symbol.
You use other tools to find the relevant content and
then use your knowledge of the codebase to write the regex, if you haven't collected enough information of this content yet.
You are extremely good at regex, so you never need to check whether the replacement produced the correct result.
In particular, you know what to escape and what not to escape, and you know how to use wildcards.
Also, the regex tool never adds any indentation (contrary to the symbolic editing tools), so you have to take care to add the correct indentation
when using it to insert code.
Moreover, the replacement tool will fail if it can't perform the desired replacement, and this is all the feedback you need.
Your overall goal for replacement operations is to use relatively short regexes, since I want you to minimize the number
of output tokens. For replacements of larger chunks of code, this means you intelligently make use of wildcards for the middle part
and of characteristic snippets for the before/after parts that uniquely identify the chunk.

For small replacements, up to a single line, you follow the following rules:

  1. If the snippet to be replaced is likely to be unique within the file, you perform the replacement by directly using the escaped version of the
    original.
  2. If the snippet is probably not unique, and you want to replace all occurrences, you use the `allow_multiple_occurrences` flag.
  3. If the snippet is not unique, and you want to replace a specific occurrence, you make use of the code surrounding the snippet
    to extend the regex with content before/after such that the regex will have exactly one match.
  4. You generally assume that a snippet is unique, knowing that the tool will return an error on multiple matches. You only read more file content
    (for crafvarting a more specific regex) if such a failure unexpectedly occurs.

Examples:

1 Small replacement
You have read code like

  ```python
  ...
  x = linear(x)
  x = relu(x)
  return x
  ...
  ```

and you want to replace `x = relu(x)` with `x = gelu(x)`.
You first try `replace_regex()` with the regex `x = relu\(x\)` and the replacement `x = gelu(x)`.
If this fails due to multiple matches, you will try `(linear\(x\)\s*)x = relu\(x\)(\s*return)` with the replacement `\1x = gelu(x)\2`.

2 Larger replacement

You have read code like

```python
def my_func():
  ...
  # a comment before the snippet
  x = add_fifteen(x)
  # beginning of long section within my_func
  ....
  # end of long section
  call_subroutine(z)
  call_second_subroutine(z)
```
and you want to replace the code starting with `x = add_fifteen(x)` until (including) `call_subroutine(z)`, but not `call_second_subroutine(z)`.
Initially, you assume that the the beginning and end of the chunk uniquely determine it within the file.
Therefore, you perform the replacement by using the regex `x = add_fifteen\(x\)\s*.*?call_subroutine\(z\)`
and the replacement being the new code you want to insert.

If this fails due to multiple matches, you will try to extend the regex with the content before/after the snippet and match groups.
The matching regex becomes:
`(before the snippet\s*)x = add_fifteen\(x\)\s*.*?call_subroutine\(z\)`
and the replacement includes the group as (schematically):
`\1<new_code>`

Generally, I remind you that you rely on the regex tool with providing you the correct feedback, no need for more verification!

IMPORTANT: REMEMBER TO USE WILDCARDS WHEN APPROPRIATE! I WILL BE VERY UNHAPPY IF YOU WRITE LONG REGEXES WITHOUT USING WILDCARDS INSTEAD!
