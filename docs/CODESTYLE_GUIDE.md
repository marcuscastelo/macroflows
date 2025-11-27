# Macroflows – Concrete Codebase Style & Anti-Patterns Guide

_Last updated: 2025-07-08_

This document provides **concrete, specific guidelines** for the Macroflows codebase, based on actual patterns found in the code and specific improvements needed.

---

## **Naming Conventions (Concrete Examples)**

### ✅ Good Naming
```typescript
// Functions: Descriptive action verbs
isRecipedGroupUpToDate(group, recipe) // vs checkGroup()
convertToGroups(data)                  // vs convert()
addItemsToGroup(group, items)         // vs addItems()

// Files: Specific purpose
comparison.ts                          // vs utils.ts
itemGroupService.ts                   // vs service.ts
macroOverflow.ts                      // vs overflow.ts

// Components: Complete description
ItemGroupEditModal                     // vs GroupModal
TemplateSearchModal           // vs SearchModal
```

### ❌ Avoid Generic Names
```typescript
// Too generic
utils.ts, helper.ts, common.ts
group(), item(), data()
Editor, Service, Manager
```

---

## **Modern Architecture Patterns - Day-Diet Standard**

### ✅ Gateway + Repository + Store Pattern
Following the day-diet module, all modules should implement:

```typescript
// 1. Gateway Layer (infrastructure/supabase/)
export function createSupabaseFoodGateway(): FoodRepository {
  return {
    fetchFoodsByName,
    fetchFoodById,
    insertFood,
    updateFoodById,
    deleteFoodById,
  }
}

// 2. Repository Layer (infrastructure/)
const supabaseGateway = createSupabaseFoodGateway()
const errorHandler = createErrorHandler('application', 'Food')

export function createFoodRepository(): FoodRepository {
  return { fetchFoodsByName, fetchFoodById, /* ... */ }
}

export async function fetchFoodsByName(name: string): Promise<Food[]> {
  try {
    const foods = await supabaseGateway.fetchFoodsByName(name)
    foodCacheStore.upsertToCache(foods)
    return foods
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

// 3. Store Layer (infrastructure/signals/)
const [foods, setFoods] = createSignal<readonly Food[]>([])

export const foodCacheStore = {
  foods,
  setFoods,
  clearCache: () => setFoods([]),
  upsertToCache: (foods: Food[]) => { /* logic */ },
  removeFromCache: (filter) => { /* logic */ },
}

// 4. Service Layer (application/services/)
export function createFoodSearchService(deps: {
  getFoods: () => readonly Food[]
  clearCache: () => void
}) {
  return (searchTerm: string) => {
    // Complex business logic with injected dependencies
  }
}

// 5. UseCase Layer (application/usecases/)
const foodRepository = createFoodRepository()

export async function createFood(food: NewFood): Promise<void> {
  await showPromise(
    foodRepository.insertFood(food),
    {
      loading: 'Criando alimento...',
      success: 'Alimento criado com sucesso',
      error: 'Erro ao criar alimento',
    },
    { context: 'user-action', audience: 'user' },
  )
}
```

### Naming Standards
- **Gateway**: `createSupabase*Gateway()`
- **Repository**: `create*Repository()`
- **Store**: `*Store` objects (e.g., `foodCacheStore`)
- **Service**: `create*Service()`
- **Methods**: `fetch*By*` pattern

---

## **Clean Architecture - Concrete Structure**

### Domain Layer (`~/modules/*/domain/`)
**Purpose**: Pure business logic, no side effects
- **Never import or use side-effect utilities** (e.g., `handleApiError`, logging, toasts, API calls).
- **Only throw standard errors** (e.g., `throw new Error('descriptive message', { cause: { context } })`)
- If you need to provide error context, use custom error classes with properties, but do not depend on external modules.

```typescript
// GOOD (domain):
throw new Error('Group mismatch: cannot mix different groups', { 
  cause: { groupId, recipeId } 
})

// BAD (domain):
import { handleApiError } from '~/shared/error/errorHandler'
handleApiError(...)
```

### Application Layer (`~/modules/*/application/`)
**Purpose**: Use cases, orchestration, data conversion, error handling
- Responsible for catching errors from the domain and calling `handleApiError` with full context.
- Handles all user feedback (toasts, logging, etc.).

```typescript
try {
  domainFunc()
} catch (e) {
  handleApiError(e, {
    component: 'ItemGroupForm',
    operation: 'submitGroup',
    additionalData: { userId }
  })
  throw e
}
```

---

## Import Rules Violations
- **Barrel Files (`index.ts`) are BANNED:** The `CLAUDE.md` explicitly states that barrel files (`index.ts`) that only re-export from other files are forbidden.

## Dynamic Imports (`import()`) Ban

### Policy
**Inline dynamic imports are banned** in application code. Dynamic imports (`import()`) should only be used through approved code-splitting patterns.

### Approved Patterns
1. **`lazyImport()` utility** for component lazy loading:
   ```typescript
   // src/shared/solid/lazyImport.ts - approved pattern
   const { UserInfo } = lazyImport(
     () => import('~/sections/profile/components/UserInfo'),
     ['UserInfo'],
   )
   ```

2. **SolidJS `lazy()`** for component code-splitting:
   ```typescript
   import { lazy } from 'solid-js'
   const LazyComponent = lazy(() => import('~/components/MyComponent'))
   ```

### ❌ Forbidden Patterns
```typescript
// BAD: Inline dynamic import in catch block
try {
  await doSomething()
} catch (error) {
  import('~/shared/utils/logging')
    .then(({ logging }) => logging.error(error))
}

// BAD: Inline dynamic import for runtime module loading
const module = await import('~/utils/something')
```

### ✅ Correct Approach
```typescript
// GOOD: Static import at the top of the file
import { logging } from '~/shared/utils/logging'

try {
  await doSomething()
} catch (error) {
  logging.error('Error occurred:', error)
}
```

### Exceptions (Allowed Files)
The ESLint rule (`no-restricted-syntax` with `ImportExpression` selector) is disabled for:
- `src/shared/solid/lazyImport.ts` - the lazy loading utility itself
- `src/app.tsx` - app entry point
- `src/routes/**/*.tsx` - route components with lazy-loaded children
- `src/sections/**/*.tsx` - section components using `lazyImport()`
- `src/modules/observability/**/*.ts` - infrastructure code for SSR/client detection
- `**/*.test.ts`, `**/*.test.tsx` - test files for mocking

### Requesting Exceptions
If you need to add a new exception:
1. Add the file pattern to `eslint.config.mjs` in the dynamic imports exception block
2. Document the reason in the ESLint config comment
3. Ensure the usage follows code-splitting best practices

## **Component Duplication - Specific Cases**


### ❌ Found Duplications
```typescript
// MealEditView.tsx and RecipeEditView.tsx have identical:
// 1. Copy/paste clipboard logic (lines 90-120 in both files)
// 2. Schema validation for clipboard
// 3. handlePasteAfterConfirm logic

// TODO comment in both files:
// "Remove code duplication between MealEditView and RecipeView"
```


## 🛑 Error Handling Standard

- **Domain layer:** Only throws pure errors. Never imports or uses `handleApiError` or any side-effect utility.
- **Application layer:** Always catches errors from domain and calls `handleApiError` with context (`component`, `operation`, `additionalData`).
- **UI/Controller:** May also call `handleApiError` for UI-specific errors.

**Example:**
```typescript
// Domain
throw new GroupConflictError('Group mismatch', { groupId, recipeId })

// Application
try {
  domainFunc()
} catch (e) {
  handleApiError(e, {
    component: 'ItemGroupForm',
    operation: 'submitGroup',
    additionalData: { userId }
  })
  throw e
}
```

---

## 🚦 Domain vs Application Logic

- **Domain validation:** Pure, context-free rules (e.g., "a group cannot have duplicate items").
- **Application validation:** Rules that depend on user, permissions, UI state, or workflow context.

```typescript
// Domain
export function isValidGroup(group: ItemGroup): boolean

// Application
export function canEditGroup(user: User, group: ItemGroup, screenState: ScreenState): boolean
```

---

## 🚫 Language Policy

- Prefer English for code, comments, and commits for consistency and future scalability.
- Portuguese is acceptable for internal docs or discussions if the whole team is fluent.
- UI/UX: always in Portuguese, as required by the product.

---

## **Fire-and-Forget Promises & the `void` Operator**

### When to Use `void` for Promises

- Use the `void` operator in event handlers (e.g., `onClick`, `onChange`) **only when**:
  - The async function's result is not needed for the user flow.
  - All error handling and user feedback (toasts, logging) are handled in the application layer.
  - The promise is truly fire-and-forget (e.g., background refresh, non-critical side effect).
- Do **not** use `.catch(() => {})` to silence errors. All errors must be handled in the application layer, and the `void` operator signals that the promise is intentionally not awaited in the UI.
- If the reason for `void` is not obvious, add a comment.

**Example:**
```tsx
// OK: fire-and-forget, feedback handled in application layer
<button onClick={() => {
  void insertDayDiet(createDayDiet({
    owner: currentUser().id,
    target_day: selectedDay,
    meals: DEFAULT_MEALS,
  }))
}}>
  Create blank day
</button>
```

### Why This Is Not a Code Smell
- The `void` operator is a clear, explicit signal to other developers that the promise is intentionally not awaited and that all error handling is delegated to the application layer.
- This pattern is preferred over leaving unhandled promises, which can cause linter/type-check errors, and over using `.catch(() => {})`, which can swallow errors silently.
- This approach keeps UI components clean and delegates all error/toast logic to the application layer, following Clean Architecture principles.
- **Fire-and-forget should be the exception, not the rule.**

#### Fire-and-Forget Checklist
- [ ] The promise result is not needed for the user flow.
- [ ] All error handling and user feedback are handled in the application layer.
- [ ] Usage is limited to event handlers, parallel effects, or non-critical callbacks.
- [ ] The reason for `void` is documented if not obvious.

---
