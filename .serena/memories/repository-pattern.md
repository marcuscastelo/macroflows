# Repository Pattern - Macroflows

## New Day-Diet Architecture Standard

### ✅ Gateway + Repository + Cache Pattern

**Three-Layer Structure:**
1. **Gateway Layer** (`infrastructure/supabase/`) - Direct Supabase interaction
2. **Repository Layer** (`infrastructure/`) - Cache management + error handling
3. **Store Layer** (`infrastructure/signals/`) - Reactive state management

**Gateway Pattern:**
```typescript
// infrastructure/supabase/supabaseDayGateway.ts
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

**Repository with Cache & Error Handling:**
```typescript
// infrastructure/dayDietRepository.ts
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

**Store Pattern:**
```typescript
// infrastructure/signals/dayCacheStore.ts
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

**Service Pattern:**
```typescript
// application/services/cacheManagement.ts
export function createCacheManagementService(deps: {
  getExistingDays: () => readonly DayDiet[]
  getCurrentDayDiet: () => DayDiet | null
  clearCache: () => void
}) {
  return ({ currentTargetDay, userId }: {
    currentTargetDay: string
    userId: User['uuid']
  }) => {
    // Complex business logic with injected dependencies
  }
}
```

**UseCase Pattern:**
```typescript
// application/usecases/dayCrud.ts
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

### New Architecture Rules
- **Gateway naming**: Use `createSupabase*Gateway()` for Supabase layer
- **Repository naming**: Use `create*Repository()` for cache + error handling layer
- **Store naming**: Use `*Store` objects with reactive signals
- **Service pattern**: Dependency injection with explicit parameters
- **UseCase pattern**: Toast integration for user operations
- **Naming convention**: `fetch*By*` patterns (e.g., `fetchDayDietByUserIdAndTargetDay`)
- **Error handling**: Always use `createErrorHandler` in repository layer
- **Cache integration**: Repository layer manages cache upsert/remove operations