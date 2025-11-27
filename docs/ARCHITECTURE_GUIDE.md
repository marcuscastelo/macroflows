# 🧭 SolidJS Frontend Architecture Guide

This guide defines the project's standard architecture to ensure consistency, scalability, and maintainability. Follow the sections below to understand how to structure, name, and build each part of the application.

---

## 📁 Module Structure

All domains should be placed under `src/modules/<name>`, following this structure:

```txt
modules/
  └── <domain>/
      ├── domain/              # Types, entities, and repository interfaces
      ├── application/         # Orchestration logic
      │   ├── usecases/       # CRUD operations with toast integration
      │   └── services/       # Complex business logic services
      ├── infrastructure/      # Implementations and data management
      │   ├── supabase/       # Supabase gateway implementations  
      │   └── signals/        # Reactive stores and state management
      ├── ui/                  # Pure presentational components
      ├── routes/              # Solid Router entrypoints
      └── tests/               # Module-specific tests
```

---

## ⚙️ General Rules

- ✅ **Strict TypeScript**: `noImplicitAny`, `strictNullChecks`, etc.
- 🚫 **Avoid `any`, `as any`, `@ts-ignore`**, except inside `infrastructure/`.
- ✅ **Follow the layered architecture**:
  - `domain`: Entities, types, interfaces
  - `application`: useCases, SolidJS resources
  - `infrastructure`: Supabase, APIs, DAOs
  - `ui`: Pure presentational components
  - `routes`: Loader + composition
- ✅ Use `cn()` to compose Tailwind classes
- ✅ Use `createResource`, `createSignal`, or `store` as state layer
- 🔁 Avoid complex logic outside `application/`

---

## ✅ Real Example: `day-diet` Module

### `domain/dayDiet.ts`

```ts
export type DayDiet = {
  id: string;
  userId: string;
  date: string;
  totalCalories: number;
};

export const createDayDiet = (data: DayDiet): DayDiet => {
  return data;
};
```

### `domain/dayDietRepository.ts`

```ts
export type DayDietRepository = {
  fetchDayDietByUserIdAndTargetDay: (
    userId: User['uuid'],
    targetDay: string,
  ) => Promise<DayDiet | null>
  fetchDayDietsByUserIdBeforeDate: (
    userId: User['uuid'],
    beforeDay: string,
    limit?: number,
  ) => Promise<readonly DayDiet[]>
  fetchDayDietById: (dayId: DayDiet['id']) => Promise<DayDiet | null>
  insertDayDiet: (newDay: NewDayDiet) => Promise<DayDiet | null>
  updateDayDietById: (
    dayId: DayDiet['id'],
    newDay: NewDayDiet,
  ) => Promise<DayDiet | null>
  deleteDayDietById: (id: DayDiet['id']) => Promise<void>
}
```

### `infrastructure/supabase/supabaseDayGateway.ts`

```ts
import { DayDietRepository } from "../../domain/dayDietRepository";
import { DayDiet } from "../../domain/dayDiet";
import { supabase } from "~/shared/utils/supabase";

export function createSupabaseDayGateway(): DayDietRepository {
  return {
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    fetchDayDietById,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: string, 
  targetDay: string
): Promise<DayDiet | null> {
  const { data, error } = await supabase
    .from("days")
    .select()
    .eq("owner", userId)
    .eq("target_day", targetDay)
    .single();
    
  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  
  return dayDietSchema.parse(data);
}
```

### `infrastructure/dayDietRepository.ts`

```ts
import { createSupabaseDayGateway } from './supabase/supabaseDayGateway';
import { dayCacheStore } from './signals/dayCacheStore';
import { createErrorHandler } from '~/shared/error/errorHandler';

const supabaseGateway = createSupabaseDayGateway();
const errorHandler = createErrorHandler('application', 'DayDiet');

export function createDayDietRepository(): DayDietRepository {
  return {
    fetchDayDietById,
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  };
}

export async function fetchDayDietByUserIdAndTargetDay(
  userId: string,
  targetDay: string,
): Promise<DayDiet | null> {
  try {
    const dayDiet = await supabaseGateway.fetchDayDietByUserIdAndTargetDay(userId, targetDay);
    if (dayDiet) {
      dayCacheStore.upsertToCache(dayDiet);
    } else {
      dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay });
    }
    return dayDiet;
  } catch (error) {
    errorHandler.error(error);
    dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay });
    return null;
  }
}
```

### `infrastructure/signals/dayCacheStore.ts`

```ts
import { createSignal, untrack } from 'solid-js';

const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([]);

function upsertToCache(dayDiet: DayDiet) {
  const existingDayIndex = untrack(dayDiets).findIndex(
    (d) => d.target_day === dayDiet.target_day,
  );
  setDayDiets((existingDays) => {
    const days = [...existingDays];
    if (existingDayIndex >= 0) {
      days[existingDayIndex] = dayDiet;
    } else {
      days.push(dayDiet);
      days.sort((a, b) => a.target_day.localeCompare(b.target_day));
    }
    return days;
  });
}

function removeFromCache<T extends keyof DayDiet>(filter: {
  by: T
  value: DayDiet[T]
}) {
  setDayDiets((days) => days.filter((d) => d[filter.by] !== filter.value));
}

export const dayCacheStore = {
  dayDiets,
  setDayDiets,
  clearCache: () => setDayDiets([]),
  upsertToCache,
  removeFromCache,
};
```

### `infrastructure/signals/dayStateStore.ts`

```ts
import { createSignal } from 'solid-js';
import { getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils';

const [targetDay, setTargetDay] = createSignal<string>(getTodayYYYYMMDD());

export const dayStateStore = {
  targetDay,
  setTargetDay,
};
```

### `application/services/cacheManagement.ts`

```ts
export function createCacheManagementService(deps: {
  getExistingDays: () => readonly DayDiet[]
  getCurrentDayDiet: () => DayDiet | null
  clearCache: () => void
}) {
  return ({ currentTargetDay, userId }: {
    currentTargetDay: string
    userId: User['uuid']
  }) => {
    const existingDays = untrack(deps.getExistingDays);
    
    // If any day is from other user, purge cache
    if (existingDays.find((d) => d.owner !== userId)) {
      deps.clearCache();
      void fetchTargetDay(userId, currentTargetDay);
      return;
    }
  };
}
```

### `application/usecases/dayCrud.ts`

```ts
import { createDayDietRepository } from '../../infrastructure/dayDietRepository';
import { showPromise } from '~/modules/toast/application/toastManager';

const dayRepository = createDayDietRepository();

export async function fetchTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<void> {
  await dayRepository.fetchDayDietByUserIdAndTargetDay(userId, targetDay);
}

export async function insertDayDiet(dayDiet: NewDayDiet): Promise<void> {
  await showPromise(
    dayRepository.insertDayDiet(dayDiet),
    {
      loading: 'Criando dia de dieta...',
      success: 'Dia de dieta criado com sucesso',
      error: 'Erro ao criar dia de dieta',
    },
    { context: 'user-action', audience: 'user' },
  );
}
```

### `ui/DayDietCard.tsx`

```tsx
import { Component } from "solid-js";
import { DayDiet } from "../domain/dayDiet";
import { cn } from "~/lib/utils";

export const DayDietCard: Component<{ data: DayDiet }> = (props) => (
  <div class={cn("rounded-xl bg-white shadow p-4")}>
    <p class="text-sm text-gray-500">{props.data.date}</p>
    <p class="text-lg font-bold">{props.data.totalCalories} kcal</p>
  </div>
);
```

### `routes/index.tsx`

```tsx
import { createDayDietResource } from "../application/dayDiet";
import { DayDietCard } from "../ui/DayDietCard";
import { Show } from "solid-js";

export default function DayDietPage() {
  const dayDiet = createDayDietResource("user-id-mock", "2025-06-02");

  return (
    <main>
      <Show when={dayDiet()} fallback={<p>Loading...</p>}>
        {(data) => <DayDietCard data={data()} />}
      </Show>
    </main>
  );
}
```

---

## 🧪 Testing

- Tests must be placed inside the module's `tests/` folder.
- Use `vitest` + `solid-testing-library` for components.
- For domain and application logic, use explicit mocks.

---

## 📚 Conclusion

This architecture allows frontend development to scale cleanly. New modules should follow this structure and conventions to maintain project cohesion.

---

## 📖 See also

For idiomatic code patterns, concrete anti-patterns, and real codebase examples, see [`CODESTYLE_GUIDE.md`](./CODESTYLE_GUIDE.md).

---

## 🚫 Language Policy

All code, comments, documentation, and commit messages must be written strictly in English. The only exception is user-facing UI text, which may be in Portuguese if required by the product. Any other use of Portuguese is strictly prohibited.

---

## 🛑 Error Handling Standard

All domain and application errors should use standard JavaScript `Error` instances with descriptive messages and context via the `cause` property.

- **Domain layer:** Throw pure errors with descriptive messages and optional context via `cause`. Never use side-effect utilities.
- **Application layer:** Catch domain errors and provide user feedback using:
  - `showError` from `~/modules/toast/application/toastManager` for user-facing toasts
  - `logging` from `~/shared/utils/logging` for telemetry and Sentry integration
- Always provide context (component, operation, additional data) for traceability.

**Canonical Pattern:**
```typescript
// Domain (pure)
throw new Error('Something went wrong', {
  cause: { code: 'VALIDATION_ERROR', groupId, groupRecipeId }
})

// Application (toast + telemetry)
import { showError } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

try {
  await domainFunc()
} catch (e) {
  logging.error('isRecipedGroupUpToDate failed', e, { 
    component: 'itemGroupDomain',
    additionalData: { groupId, groupRecipeId }
  })
  showError(e, { context: 'user-action' })
  throw e
}
```

---

## 🏗️ Modern Architecture Patterns (Day-Diet Standard)

### Gateway + Repository + Store Pattern

Following the day-diet module standard, all modules should implement a three-layer architecture:

#### 1. Gateway Layer (`infrastructure/supabase/`)
Direct Supabase interaction with data validation and error throwing.

```typescript
// createSupabase*Gateway() pattern
export function createSupabaseDayGateway(): DayRepository {
  return {
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    fetchDayDietById,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('owner', userId)
    .eq('target_day', targetDay)
    .single()
    
  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return dayDietSchema.parse(data)
}
```

#### 2. Repository Layer (`infrastructure/`)
Cache management, error handling, and orchestration between Gateway and Store.

```typescript
// create*Repository() pattern
const supabaseGateway = createSupabaseDayGateway()
const errorHandler = createErrorHandler('application', 'DayDiet')

export function createDayDietRepository(): DayRepository {
  return {
    fetchDayDietById,
    fetchDayDietByUserIdAndTargetDay,
    // ... other methods
  }
}

export async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  try {
    const dayDiet = await supabaseGateway.fetchDayDietByUserIdAndTargetDay(userId, targetDay)
    if (dayDiet) {
      dayCacheStore.upsertToCache(dayDiet)
    } else {
      dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
    }
    return dayDiet
  } catch (error) {
    errorHandler.error(error)
    dayCacheStore.removeFromCache({ by: 'target_day', value: targetDay })
    return null
  }
}
```

#### 3. Store Layer (`infrastructure/signals/`)
Reactive state management with SolidJS signals.

```typescript
// *Store pattern
const [dayDiets, setDayDiets] = createSignal<readonly DayDiet[]>([])

function upsertToCache(dayDiet: DayDiet) {
  const existingDayIndex = untrack(dayDiets).findIndex(
    (d) => d.target_day === dayDiet.target_day,
  )
  setDayDiets((existingDays) => {
    const days = [...existingDays]
    if (existingDayIndex >= 0) {
      days[existingDayIndex] = dayDiet
    } else {
      days.push(dayDiet)
      days.sort((a, b) => a.target_day.localeCompare(b.target_day))
    }
    return days
  })
}

export const dayCacheStore = {
  dayDiets,
  setDayDiets,
  clearCache: () => setDayDiets([]),
  upsertToCache,
  removeFromCache,
}
```

#### 4. Service Layer (`application/services/`)
Complex business logic with dependency injection.

```typescript
export function createCacheManagementService(deps: {
  getExistingDays: () => readonly DayDiet[]
  getCurrentDayDiet: () => DayDiet | null
  clearCache: () => void
}) {
  return ({ currentTargetDay, userId }: {
    currentTargetDay: string
    userId: User['uuid']
  }) => {
    const existingDays = untrack(deps.getExistingDays)
    
    // Complex business logic here
    if (existingDays.find((d) => d.owner !== userId)) {
      deps.clearCache()
      void fetchTargetDay(userId, currentTargetDay)
    }
  }
}
```

#### 5. UseCase Layer (`application/usecases/`)
User operations with toast integration.

```typescript
const dayRepository = createDayDietRepository()

export async function insertDayDiet(dayDiet: NewDayDiet): Promise<void> {
  await showPromise(
    dayRepository.insertDayDiet(dayDiet),
    {
      loading: 'Criando dia de dieta...',
      success: 'Dia de dieta criado com sucesso',
      error: 'Erro ao criar dia de dieta',
    },
    { context: 'user-action', audience: 'user' },
  )
}
```

### Naming Conventions

- **Gateway Functions**: `createSupabase*Gateway()`
- **Repository Functions**: `create*Repository()`
- **Store Objects**: `*Store` (e.g., `dayCacheStore`, `dayStateStore`)
- **Service Functions**: `create*Service()`
- **Fetch Methods**: `fetch*By*` (e.g., `fetchDayDietByUserIdAndTargetDay`)

---

## 🧩 Dependency Injection (DI) Pattern

### Overview

The project adopts an explicit, manual Dependency Injection (DI) pattern for all application-layer logic that orchestrates or composes multiple data sources or business rules. This approach increases testability, decouples infrastructure from application logic, and improves maintainability.

### How It Works
- **Dependencies are always passed as arguments** to orchestration functions (e.g., logic, use cases), never imported or instantiated directly inside them.
- **Repositories and fetchers** are created at the application layer and injected into logic functions.
- **No direct infrastructure imports** in logic modules: all dependencies must be provided from the outside.

### Example: Search Module

```ts
// application/searchLogic.ts
export type FetchTemplatesDeps = {
  fetchUserRecipes: (userId: User['uuid']) => Promise<readonly Recipe[] | null>
  fetchUserRecipeByName: (userId: User['uuid'], name: string) => Promise<readonly Recipe[] | null>
  fetchUserRecentFoods: (userId: User['uuid']) => Promise<...>
  fetchFoodById: (id: number) => Promise<Food | null>
  fetchRecipeById: (id: number) => Promise<Recipe | null>
  fetchFoods: (opts: { limit?: number; allowedFoods?: number[] }) => Promise<readonly Food[] | null>
  fetchFoodsByName: (name: string, opts: { limit?: number; allowedFoods?: number[] }) => Promise<readonly Food[] | null>
  getFavoriteFoods: () => number[]
  fetchFoodsByIds: (ids: number[]) => Promise<readonly Food[] | null>
}

export async function fetchTemplatesByTabLogic(
  tabId: string,
  search: string,
  userId: User['uuid'],
  deps: FetchTemplatesDeps,
): Promise<readonly Template[]> {
  // ...logic using only deps
}
```

```ts
// application/search.ts
import { fetchTemplatesByTabLogic } from './searchLogic'

export const templates = createResource(
  () => ({ tab: debouncedTab(), search: debouncedSearch(), userId: currentUserId() }),
  (signals) => fetchTemplatesByTabLogic(
    signals.tab,
    signals.search,
    signals.userId,
    {
      fetchUserRecipes,
      fetchUserRecipeByName,
      fetchUserRecentFoods,
      fetchFoodById,
      fetchRecipeById,
      fetchFoods,
      fetchFoodsByName,
      getFavoriteFoods,
      fetchFoodsByIds,
    },
  ),
)
```

### Naming Recommendations
- Use `fetchX` for pure data accessors (repositories, fetchers).
- Use `fetchXLogic` (or `getXLogic`, `useXLogic`) for orchestration/composition logic that receives dependencies via arguments.
- Never import infrastructure directly in logic modules.

### Benefits
- **Testability:** All logic can be tested with mocks/stubs.
- **Decoupling:** Application logic is not tied to infrastructure details.
- **Clarity:** Function signatures make dependencies explicit.

---