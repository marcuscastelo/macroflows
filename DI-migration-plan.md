# DI Migration Plan — macroflows

Status: Draft (complete, actionable plan for externalizing DI across `src/**/application/**`)

This document contains a step-by-step migration plan, batch list with files, templates, commands, commit/PR guidance, verification checklist, and troubleshooting notes. Save this file and use it as your source of truth when you reset the conversation and implement the changes.

---

## High-level goal

- Replace implicit/service-locator style dependencies in `src/**/application/**` with explicit Dependency Injection (DI).
- Pattern: each use-case/service module becomes a factory: `createXxxUseCases(deps)` and exposes a backward-compatible shim `export const xxxUseCases = createXxxUseCases({...})`.
- Wire default factories/instances in `src/di/container.tsx` (the central container).
- Migrate consumers incrementally. Keep shims until all consumers are migrated.
- Run full checks after each batch: `npm run copilot:check`.

---

## Prerequisites

- Ensure `src/di/container.tsx` and `src/sections/common/context/Providers.tsx` exist and are ready to accept wiring (these were created/adjusted earlier).
- Have a clean working tree before starting each batch.
- Tests and linters must be green before starting a batch.

Commands (run before/after batches):
```/dev/null/commands.sh#L1-10
# From repo root (macroflows)
npm run copilot:check    # runs lint, tsc, tests via the repo's script
# alternative quick commands:
pnpm run lint
pnpm run test
```

---

## Overall strategy & rules

- Refactor in batches by domain/module. Each batch is a small, reviewable PR.
- For each file:
  1. Convert the exported object of use-cases into a factory `createXxxUseCases(deps)`.
  2. Add `export const xxxUseCases = createXxxUseCases({ /* default deps */ })` as a shim to avoid immediate breaking changes.
  3. Move imports of infra (repositories, fetchers, clients) into factory `deps`. When factories rely on other modules that have not yet been migrated, prefer passing an adapter or keep local import but flag it for follow-up.
  4. Add JSDoc for exported types/functions (repository rules).
- Do NOT create `index.ts` barrel files (repository rule).
- Prefer explicit parameter types; avoid `any` and large `as` casts.
- Container shape should be stable and frozen; prefer `Readonly<Container>`.

---

## List of batches and files (detected in repo)

> Note: The list below was scanned from the repository. Use it as your authoritative list to edit. If new files exist locally, adjust the plan accordingly.

### Batch 0 — Preparation DI (one-time)
- `src/di/container.tsx` (container factory, Provider)
- `src/sections/common/context/Providers.tsx` (Provider usage / lifecycle init)

### Batch 1 — Auth & User (high impact)
- `src/modules/auth/application/usecases/authUseCases.ts`
- `src/modules/auth/application/services/authService.ts`
- `src/modules/auth/application/authDI.ts`
- `src/modules/auth/application/store/authStore.ts`
- `src/modules/user/application/usecases/userUseCases.ts`
- `src/modules/user/application/services/userService.ts`
- `src/modules/user/application/store/userStore.ts`

### Batch 2 — Diet core (recipes, items, food, meal, macro-profile)
- `src/modules/diet/recipe/application/usecases/recipeCrud.ts`
- `src/modules/diet/recipe/application/services/cacheManagement.ts`
- `src/modules/diet/item/application/recipeItemUseCases.ts` (already converted; review)
- `src/modules/diet/food/application/usecases/foodCrud.ts`
- `src/modules/diet/meal/application/meal.ts`
- `src/modules/diet/macro-profile/application/usecases/macroProfileUseCases.ts`
- `src/modules/diet/macro-profile/application/service/macroProfileCrudService.ts`

### Batch 3 — Day-diet, template, template-search
- `src/modules/diet/day-diet/application/usecases/createBlankDay.ts`
- `src/modules/diet/day-diet/application/usecases/dayEditOrchestrator.ts`
- `src/modules/diet/day-diet/application/usecases/dayUseCases.ts`
- `src/modules/diet/template/application/createGroupFromTemplate.ts`
- `src/modules/diet/template/application/templateToItem.ts`
- `src/modules/template-search/application/templateSearchLogic.ts`
- `src/modules/template-search/application/usecases/templateSearchState.ts`

### Batch 4 — Weight / Measure / Charts
- `src/modules/weight/application/weight/usecases/weightUseCases.ts`
- `src/modules/weight/application/weight/weightCrud.ts`
- `src/modules/weight/application/chart/weightChartUseCases.ts`
- `src/modules/measure/application/usecases/measureCrud.ts`
- `src/modules/measure/application/usecases/measureState.ts`

### Batch 5 — Toast, Clipboard, Recent-food, Import/Export
- `src/modules/toast/application/toastManager.ts`
- `src/modules/clipboard/application/usecases/clipboardUseCases.ts`
- `src/modules/recent-food/application/usecases/recentFoodCrud.ts`
- `src/modules/import-export/application/exportUtils.ts`
- `src/modules/import-export/application/importValidation.ts`
- `src/modules/import-export/application/idRegeneration.ts`

### Batch 6 — Profile, Search, Observability, Misc
- `src/modules/profile/application/profile.ts`
- `src/modules/search/application/usecases/cachedSearchCrud.ts`
- `src/modules/observability/application/telemetry.ts`
- and other remaining `src/modules/*/application/*` files.

### Batch 7 — Cleanup final
- Remove backward-compat shims as consumers migrate.
- Remove dead imports, run full lint & test again.

**Progress (Batch 7):**

Completed (previous work):
- [x] `weightUseCases` — centralized in DI container, shim removed
  - Refactored `createWeightUseCases` to accept required `authDeps` parameter
  - Removed circular `useCases` import from weightUseCases.ts
  - Updated all consumers (8 files) to use `useCases.weightUseCases()`
  - Updated `container.tsx` to provide `authDeps` when creating default weight use-cases
- [x] `weightChartUseCases` — centralized in DI container, shim removed
  - Refactored `createWeightChartUseCases` to accept granular `WeightChartDeps` instead of `typeof useCases`
  - Updated consumers (WeightChartTooltip, WeightEvolution) to use `useCases.weightChartUseCases()`

Completed (current work - 2025-12-06):
- [x] `macroProfileCrudService` — shim removed (internal only, used by macroProfileUseCases)
  - Made `createMacroProfileUseCases` use the factory directly with optional deps
  - Removed shim export from `macroProfileCrudService.ts`
- [x] `dayUseCases` (duplicate in dayEditOrchestrator) — removed shadowing export
  - Removed duplicate shim from `dayEditOrchestrator.ts` that was shadowing main export
  - Updated test to create instance using factory
  - Updated `DayMeals.tsx` to create module-level instance
  - Fixed TypeScript 'any' type errors in catch blocks
- [x] `macroOverflowUseCases` — shim removed (1 consumer + 2 legacy exports)
  - Removed shim and legacy named exports (`isOverflow`, `getAvailableMacros`)
  - Updated consumers to create module-level instances with factory
  - Updated `ItemEditBody.tsx`, `ItemViewMacros.tsx`, `TemplateSearchModal.tsx`
- [x] `foodCrud` — shim removed (1 consumer + named exports)
  - Removed shim and legacy named exports (`fetchFoods`, `fetchFoodsByName`, `fetchFoodByEan`)
  - Updated `EANSearch.tsx` to create module-level instance
  - Updated `templateSearchState.ts` to accept `foodCrud` as optional dependency

Blocked (circular dependency):
- [ ] `clipboardUseCases` — cannot centralize due to import chain causing circular dependency:
  - Import chain: `useCases.ts` → `clipboardUseCases` → `PasteConfirmModal` → `ItemListView` → `ItemView` → `ItemViewMacros` → `macroOverflow` → `dayUseCases` → `useCases.ts`
  - This requires refactoring `macroOverflow` to not import `dayUseCases` at module level, which is out of scope for this batch.
  - Keeping shim pattern for now.

Remaining shims to evaluate (may have similar circular dependency issues):
- `macroProfileUseCases` (3 consumers)
- `dayUseCases` (14 consumers) - high risk, needs careful planning
- `createBlankDay` (function shim)
- `recipeCrud` (4 consumers)
- `recipeItemUseCases` (4 consumers)
- `macroTargetUseCases` (4 consumers)
- `mealUseCases` (0 direct imports, may be using through other modules)
- `authUseCases`, `userUseCases` (already in central container)

**Commits (Batch 7):**
- `de7b3ccd` — refactor(di): batch-7 - centralize weightUseCases in DI container
- `861518ea` — refactor(di): batch-7 - migrate weightUseCases consumers to use container
- `696725b4` — refactor(di): batch-7 - remove weightUseCases backward-compatible shim
- `ab2e709c` — refactor(di): batch-7 - make weightUseCases.authDeps required, remove circular import
- `5f66ea6e` — docs(di): update migration plan with Batch 7 progress
- `0021f244` — refactor(di): batch-7 - centralize weightChartUseCases in DI container
- `ad458e2` — refactor(di): Remove macroProfileCrudService and dayUseCases shims (2025-12-06)
- `7f26850` — refactor(di): Remove macroOverflowUseCases shim (2025-12-06)
- `69a8491` — refactor(di): Remove foodCrud shims (2025-12-06)

---

## Per-file change template (concrete before -> after)

A. Example: converting a legacy `fooUseCases` object

Before:
```/dev/null/before.example.ts#L1-40
export const fooUseCases = {
  async fetchAndDo(id: number) {
    const r = await fetchSomething(id)
    // other logic that imports infra directly
  },
  syncAction(p) {
    // ...
  }
}
```

After:
```/dev/null/after.example.ts#L1-80
/**
 * Factory that returns use-cases for Foo
 * @param deps.fetchSomething - injected fetcher
 */
export function createFooUseCases(deps: { fetchSomething: (id:number)=>Promise<Foo|null> }) {
  const { fetchSomething } = deps

  return {
    async fetchAndDo(id: number) {
      const r = await fetchSomething(id)
      // same logic, but using injected fetcher
    },
    syncAction(p: string) {
      // ...
    }
  }
}

// Backward-compatible default export (shim)
import { fetchSomething } from '~/modules/foo/infrastructure/fooApi'
export const fooUseCases = createFooUseCases({ fetchSomething })
```

B. Example: factory typing for reuse
```/dev/null/factory.type.ts#L1-40
export type FooUseCases = ReturnType<typeof createFooUseCases>
```

C. Container wiring (example snippet)
```/dev/null/container.example.ts#L1-80
// inside createContainer / merged object
fooUseCases: overrides.fooUseCases ?? createFooUseCases({
  fetchSomething: () => createFooRepository().fetchById
}),
```

---

## Consumer migration patterns

- Preferred: components call `useContainer()` to get the use-cases:
```/dev/null/consumer.example.tsx#L1-40
import { useContainer } from '~/di/container'

function MyComponent() {
  const container = useContainer()
  const foo = container.fooUseCases
  // use foo.fetchAndDo(...)
}
```

- Temporary: keep `import { fooUseCases } from '~/modules/foo/application/fooUseCases'` working via shim. Migrate consumers in subsequent small PRs.

---

## Commands & Git flow

Recommended workflow per batch:
```/dev/null/workflow.sh#L1-40
git checkout -b refactor/di/batch-<N>
# apply changes for the batch
npm run copilot:check        # run checks (lint + tsc + tests)
# if green:
git add .
git commit -m "refactor(di): batch <N> - <module-names>

Converted X files to factory-based DI and registered defaults in container.
Kept backward-compatible shims where needed."
git push origin refactor/di/batch-<N>
# open PR and wait for CI
```

- If check fails, re-run up to 2 times; if still failing, collect logs and fix locally, then repeat.

---

## Tests & verification

- Use the repository script (recommended):
```/dev/null/checks.sh#L1-10
npm run copilot:check
```
- If tests fail:
  - Inspect TS/ESLint output carefully — most common issues:
    - Missing `| null` in return type of fetchers used in createResource.
    - Solid `reactivity` lint errors when you expose signals across container; prefer factories that create signals or expose accessor functions.
    - Avoid `any` and excessive `as` casts.

---

## Commit & PR message templates

Example commit header/body:
```/dev/null/commit.msg#L1-12
refactor(di): batch 2 - diet/recipe & diet/item

- Converted recipeCrud.ts and recipeItemUseCases.ts to factory-based DI:
  - createRecipeCrud(deps)
  - createRecipeItemUseCases(deps)
- Added backward-compatible shims so imports don't break.
- Wired defaults in src/di/container.tsx
- Ran npm run copilot:check and fixed lint/type issues.
```

PR description checklist:
- Files changed (list)
- Reason & migration pattern
- Tests ran (local output snippet)
- Notes for reviewers (things to watch, follow-ups)

---

## Troubleshooting common issues

1. Type errors about `Promise<T | null>` vs `Promise<T>`:
   - Update the factory `deps` signature to accept `Promise<T | null>` if repo/fetcher returns `null`.
   - Update callers accordingly.

2. Solid reactivity lint (`solid/reactivity`):
   - Do not expose live signals from the container directly. Prefer:
     - factories that create signals inside components, or
     - expose accessor functions, or
     - use `createMemo` as needed but keep the container's value stable.

3. ESLint complaining about `any` casts:
   - Replace `any` with explicit small interfaces that declare only the properties you need (e.g., footnote-shaped interface `LegacyUseCases`).

4. Tests failing after migration:
   - Identify which consumers imported the legacy object; ensure shim exists.
   - If tests import directly and expect the old shape, either:
     - update tests to create factory instances with mocked deps, or
     - keep the shim until tests are updated.

---

## Rollback procedure

- If a batch breaks CI or causes regressions that cannot be fixed quickly:
  1. Revert the branch: `git checkout main && git pull && git branch -D refactor/di/batch-<N> && git push origin --delete refactor/di/batch-<N>` (or use `git revert` on the commit after merge).
  2. Collect logs from `npm run copilot:check` and open an issue with diffs + errors.
  3. Discuss fixes in a follow-up branch and split the batch into smaller chunks if needed.

---

## How to resume with me after you reset the conversation

When you reset the chat and want me to continue, paste a short context block at the start:

- Branch name / stage: `refactor/di/batch-<N>` (or `start` if new)
- Which batch to start with (0..7)
- Files you already changed (optional list or commit SHA)
- Container status: if you added wiring in `src/di/container.tsx`, mention it
- Request example: "Continue and apply batch 1 (auth & user) and run checks."

With that minimum context I'll resume applying batches or generating concrete diffs.

---

## Full list of files (detected entries)
Use these exact paths while editing. (If you need the complete raw list in a single file, I can produce that on demand.)

- `src/di/container.tsx`
- `src/sections/common/context/Providers.tsx`
- `src/modules/auth/application/authDI.ts`
- `src/modules/auth/application/services/authService.ts`
- `src/modules/auth/application/store/authStore.ts`
- `src/modules/auth/application/usecases/authUseCases.ts`
- `src/modules/clipboard/application/store/clipboardStore.ts`
- `src/modules/clipboard/application/store/tests/clipboardStore.test.ts`
- `src/modules/clipboard/application/usecases/clipboardUseCases.ts`
- `src/modules/diet/day-diet/application/services/dayChange.ts`
- `src/modules/diet/day-diet/application/store/dayCacheStore.ts`
- `src/modules/diet/day-diet/application/store/dayChangeStore.ts`
- `src/modules/diet/day-diet/application/store/dayStateStore.ts`
- `src/modules/diet/day-diet/application/usecases/createBlankDay.ts`
- `src/modules/diet/day-diet/application/usecases/dayEditOrchestrator.ts`
- `src/modules/diet/day-diet/application/usecases/dayUseCases.ts`
- `src/modules/diet/day-diet/application/usecases/useCopyDayOperations.ts`
- `src/modules/diet/day-diet/tests/application/createBlankDay.test.ts`
- `src/modules/diet/day-diet/tests/application/dayEditOrchestrator.test.ts`
- `src/modules/diet/food/application/usecases/foodCrud.ts`
- `src/modules/diet/food/infrastructure/api/application/apiFood.ts`
- `src/modules/diet/item/application/recipeItemUseCases.ts`
- `src/modules/diet/item/application/tests/recipeItemUseCases.test.ts`
- `src/modules/diet/macro-nutrients/application/macroOverflow.ts`
- `src/modules/diet/macro-profile/application/service/macroProfileCrudService.ts`
- `src/modules/diet/macro-profile/application/store/macroProfileCacheStore.ts`
- `src/modules/diet/macro-profile/application/store/macroProfileStateStore.ts`
- `src/modules/diet/macro-profile/application/usecases/macroProfileState.ts`
- `src/modules/diet/macro-profile/application/usecases/macroProfileUseCases.ts`
- `src/modules/diet/macro-target/application/macroTargetUseCases.ts`
- `src/modules/diet/meal/application/meal.ts`
- `src/modules/diet/recipe/application/services/cacheManagement.ts`
- `src/modules/diet/recipe/application/usecases/recipeCrud.ts`
- `src/modules/diet/template/application/createGroupFromTemplate.ts`
- `src/modules/diet/template/application/templateToItem.ts`
- `src/modules/import-export/application/exportUtils.ts`
- `src/modules/import-export/application/idRegeneration.ts`
- `src/modules/import-export/application/importValidation.ts`
- `src/modules/measure/application/measureUtils.ts`
- `src/modules/measure/application/tests/measureUtils.test.ts`
- `src/modules/measure/application/usecases/measureCrud.ts`
- `src/modules/measure/application/usecases/measureState.ts`
- `src/modules/observability/application/telemetry.ts`
- `src/modules/profile/application/profile.ts`
- `src/modules/recent-food/application/tests/extractRecentFoodReference.test.ts`
- `src/modules/recent-food/application/usecases/extractRecentFoodReference.ts`
- `src/modules/recent-food/application/usecases/recentFoodCrud.ts`
- `src/modules/search/application/usecases/cachedSearchCrud.ts`
- `src/modules/template-search/application/templateSearchLogic.ts`
- `src/modules/template-search/application/tests/templateSearchLogic.test.ts`
- `src/modules/template-search/application/usecases/templateSearchState.ts`
- `src/modules/toast/application/toastManager.ts`
- `src/modules/user/application/services/userService.ts`
- `src/modules/user/application/store/userStore.ts`
- `src/modules/user/application/usecases/userUseCases.ts`
- `src/modules/weight/application/chart/weightChartUseCases.ts`
- `src/modules/weight/application/chart/tests/isWeightChartType.test.ts`
- `src/modules/weight/application/chart/weightChartSettings.ts`
- `src/modules/weight/application/weight/store/weightCacheStore.ts`
- `src/modules/weight/application/weight/usecases/weightUseCases.ts`
- `src/modules/weight/application/weight/weightCrud.ts`
- `src/modules/weight/application/weight/weightState.ts`

---

## Migration progress checklist (registro automático de progresso)

Abaixo segue um checklist detalhado do progresso realizado até o momento. Mantive shims backward-compatible onde necessário e rodei os checks (lint/ts/tests) após cada conjunto de mudanças.

- [x] Batch 0 — Preparation DI
  - [x] `src/di/container.tsx` — criado/ajustado e preparado para receber wiring de use-cases (wired defaults para auth/user).
  - [x] `src/sections/common/context/Providers.tsx` — atualizado para criar o container de bootstrap e inicializar lifecycles (usa `useCases` legacy como overrides).

- [x] Batch 1 — Auth & User
  - [x] `src/modules/user/application/usecases/userUseCases.ts` — convertido para `createUserUseCases({ repository })`, adicionado `userUseCases` shim.
    - Commit relacionado: `0d90b17e` ("refactor(di): batch 1 - user & container wiring")
  - [x] `src/di/container.tsx` — wired defaults para `userUseCases` (Supabase repo) e `authUseCases`.
    - Commit relacionado: `0d90b17e`
  - [x] `src/modules/auth/application/usecases/authUseCases.ts` — export `createAuthUseCases` e added `authUseCases` shim delegando ao `userUseCases` shim.
    - Commit relacionado: `3159e614` ("refactor(di): auth usecases shim")
  - [x] Verificação: `npm run copilot:check` passou (lint / tsc / tests).

- [x] Batch 2 — Diet core (recipes, items, food, meal, macro-profile)
  - [x] `src/modules/diet/recipe/application/usecases/recipeCrud.ts` — convertido para `createRecipeCrud({ repository })` + default `recipeCrud` + shims (`fetch*`, `insertRecipe`, etc).
    - Commit: `4e300d92` ("refactor(di): batch 2 - recipe crud factory + shims")
  - [x] `src/modules/diet/recipe/application/services/cacheManagement.ts` — já era factory-style; revisado e mantido.
  - [x] `src/modules/diet/item/application/recipeItemUseCases.ts` — já compatível com DI (usa `fetchRecipeById` shim).
  - [x] `src/modules/diet/food/application/usecases/foodCrud.ts` — convertido para `createFoodCrud({ repository })` + default shim `foodCrud`.
    - Commit: `74c193e6` ("refactor(di): batch 2 - food crud factory + shims")
  - [x] `src/modules/diet/meal/application/meal.ts` — criado `createMealUseCases(deps)` com shim `mealUseCases`, tipado para usar `DayUseCases`.
    - Commits: `1d024d79`, `22d36b6e` ("refactor(di): batch 2 - meal usecases factory + shim" / "meal uses DayUseCases type")
  - [x] `src/modules/diet/day-diet/application/usecases/dayUseCases.ts` — convertido para `createDayUseCases()` (encloses signals in createRoot) e exportado `dayUseCases` shim; export `DayUseCases` type.
    - Commits: `78e9ad7e`, `fad6fb6e` ("refactor(di): batch 2 - dayUseCases factory + shim" / "refactor(di): batch 2 - dedupe DayUseCases export")
  - [x] `src/modules/diet/macro-profile/application/service/macroProfileCrudService.ts` — convertido para `createMacroProfileCrudService` + default `macroProfileCrudService` shim.
    - Commit: `77a080eb`
  - [x] `src/modules/diet/macro-profile/application/usecases/macroProfileUseCases.ts` — convertido para `createMacroProfileUseCases({ crudService, cache })` + default shim `macroProfileUseCases`.
    - Commits: `77a080eb`, `b882ae3b`
  - [x] Verificação: `npm run copilot:check` passou após cada alteração e no conjunto final (lint / tsc / tests).

- [x] Batch 3 — Day-diet, template, template-search (concluído)
  - [x] `src/modules/diet/day-diet/application/usecases/createBlankDay.ts` — convertido para factory (`createCreateBlankDay`) com backward-compatible shim `createBlankDay`. Note: kept shim to avoid breaking consumers. Commit: `0d22e1f8`.
  - [x] `src/modules/diet/day-diet/application/usecases/dayEditOrchestrator.ts` — converted to `createDayEditOrchestrator(deps)` and shimmed as `dayUseCases`. Adjusted types and null-checks to satisfy lint. Commit: `0d22e1f8`.
  - [x] `src/modules/diet/template/application/createGroupFromTemplate.ts` — reviewed (pure/domain function); no DI required. Commit: `0d22e1f8`.
  - [x] `src/modules/diet/template/application/templateToItem.ts` — reviewed (pure/domain function); no DI required. Commit: `0d22e1f8`.
  - [x] `src/modules/template-search/application/templateSearchLogic.ts` — reviewed (pure, logic-only). Commit: `0d22e1f8`.
  - [x] `src/modules/template-search/application/usecases/templateSearchState.ts` — converted to `createTemplateSearchState(deps)` factory with a backward-compatible shim exposing previous exports. Wrapped in `createRoot` to isolate signals and added a small lint-safe usage pattern. Commit: `0d22e1f8`.

- [x] Batch 4 — Weight / Measure / Charts
  - [x] `src/modules/weight/application/weight/usecases/weightUseCases.ts` — converted to `createWeightUseCases` + shim
  - [x] `src/modules/weight/application/chart/weightChartUseCases.ts` — converted to `createWeightChartUseCases` + shim
  - [x] `src/modules/measure/application/usecases/measureCrud.ts` — converted to `createMeasureCrud` + shim
  - [x] `src/modules/measure/application/usecases/measureState.ts` — converted to `createMeasureState` + shim
  - [x] `src/modules/weight/application/weight/weightCrud.ts` — reviewed and kept as DI-friendly service factory
  - [ ] (other weight/measure/chart files) — pending review

- [x] Batch 5 — Toast, Clipboard, Recent-food, Import/Export
  - [x] `src/modules/toast/application/toastManager.ts` — factory-style reviewed
  - [x] `src/modules/clipboard/application/usecases/clipboardUseCases.ts` — factory + shim (reviewed)
  - [x] `src/modules/recent-food/application/usecases/recentFoodCrud.ts` — factory + shim (reviewed)
  - [x] `src/modules/import-export/application/exportUtils.ts` — pure helpers (no DI required)
  - [x] `src/modules/import-export/application/importValidation.ts` — pure helpers (no DI required)
  - [x] `src/modules/import-export/application/idRegeneration.ts` — pure helpers (no DI required)

- [x] Batch 6 — Profile, Search, Observability, Misc
  - [x] `src/modules/profile/application/profile.ts`
  - [x] `src/modules/search/application/usecases/cachedSearchCrud.ts`
  - [x] `src/modules/observability/application/telemetry.ts`
  - [x] `src/modules/diet/macro-target/application/macroTargetUseCases.ts`
  - [x] `src/modules/diet/macro-nutrients/application/macroOverflow.ts` (shim + legacy named exports added)
  - [x] (other remaining `src/modules/*/application/*` files) — reviewed and converted where appropriate; legacy named exports kept as shims.

---

Assistant session notes (context & remaining un-annotated progress)
- Current assistant context window usage at time of note: ~113k / 128k tokens (approx). I recorded this to help resume work if the session is reset.
- Progress that was applied in this session but hadn't yet been explicitly annotated in the plan before this update:
  - `src/modules/diet/macro-target/application/macroTargetUseCases.ts` → converted to `createMacroTargetUseCases(...)` + shim
  - `src/modules/diet/macro-nutrients/application/macroOverflow.ts` → converted to `createMacroOverflow(...)` + shim; legacy named exports `isOverflow` and `getAvailableMacros` added to preserve consumers
  - `src/modules/weight/application/chart/weightChartUseCases.ts` → converted to `createWeightChartUseCases(...)` + shim
  - `src/modules/measure/application/usecases/measureCrud.ts` → converted to `createMeasureCrud(...)` + shim
  - `src/modules/measure/application/usecases/measureState.ts` → converted to `createMeasureState(...)` + shim

These are now recorded above in the checklist.

Plans for next steps / Options (detailed)

Option A — Full Cleanup (Batch 7) — remove all backward-compatible shims
- Goal: remove all default/top-level shim exports (e.g., `export const fooUseCases = createFooUseCases()`), enforce DI everywhere by using the container or explicit factories.
- Risk: high — will break any consumer that still imports the legacy named exports. Must be performed only after verifying all consumers have been migrated.
- Steps:
  1. Discovery phase:
     - Run a global search for imports of each shim (e.g., `import { fooUseCases } from '.../foo'`) and produce a list of all consumers.
     - For each shim, build a consumer map showing file and import locations.
  2. Migration/replace phase:
     - For each consumer, decide replacement strategy:
       - If the file is application-level UI or composed via Provider/DI container, replace import to use `useCases` from `~/di/useCases` (preferred).
       - If the file is a utility/test, inject the factory via parameters or import the factory and instantiate locally in test setups.
     - Replace the imports programmatically (small targeted edits).
  3. Removal phase:
     - Remove the shim export from its source file.
     - Run `npm run copilot:check`.
     - Fix any remaining compile/test failures.
  4. Verification:
     - Run full lint/ts/tests.
     - Manual spot-check UI flows if possible.
  5. Commit strategy:
     - Make frequent commits per-group (recommended), with a final "cleanup(batch-7): remove shims" commit that summarizes changes.
  6. Rollback:
     - If regressions are found, revert the commit and triage failing consumers.
- Timeline estimate: depends on number of consumers; for this repo size likely 1–2 hours of work with iterative fixes.

Option C — One-by-one shim removal (conservative)
- Goal: remove shims incrementally to minimize risk and reduce the blast radius.
- Steps:
  1. Pick one shim to remove (e.g., `weightChartUseCases`) — choose low-risk, well-covered modules first (lots of tests).
  2. Find and update all consumers of that shim to use the DI factory/container or an injected dependency:
     - Update tests to create factory instances rather than relying on top-level shims.
  3. Remove the shim export from the source file.
  4. Run `npm run copilot:check`. Fix any issues (1–2 iteration rule).
  5. Commit the change with message: `refactor(di): batch-7 - remove shim <module>`.
  6. Repeat for the next shim.
- Advantages:
  - Low risk, easy rollback per-file.
  - Easier to track migration progress.
- Disadvantages:
  - Longer overall duration.
- Commit strategy:
  - One commit per shim removal (recommended). Optionally squash later.

Common practices & safety nets for both options
- Always run `npm run copilot:check` after each file change.
- Prefer updating tests first: update test imports to use factories before removing shims to avoid noisy failures.
- Keep commits small and descriptive. Use Conventional Commits:
  - `refactor(di): remove shim for <module>` or `refactor(di): migrate <consumer> to DI`
- If a shim removal causes widespread breakage, revert quickly and open a focused follow-up to address remaining consumers.

Manual approval before Batch 7
- I will NOT start Batch 7 (removing shims) without your explicit confirmation of which option (A or C) and the commit behavior you prefer (single final commit vs per-file commits). Please confirm the option and commit style.


- [ ] Batch 7 — Cleanup final
  - [ ] Remover shims backward-compat quando todos os consumidores forem migrados.
  - [ ] Remover imports mortos, rodar lint+tests e limpar tipos.

Commits relevantes (resumo)
- `0d90b17e` — refactor(di): batch 1 - user & container wiring
- `3159e614` — refactor(di): auth usecases shim
- `323e037c` — docs(di): add DI migration plan
- `4e300d92` — refactor(di): batch 2 - recipe crud factory + shims
- `74c193e6` — refactor(di): batch 2 - food crud factory + shims
- `1d024d79` — refactor(di): batch 2 - meal usecases factory + shim
- `22d36b6e` — refactor(di): batch 2 - meal uses DayUseCases type
- `3bbc71c2` — refactor(di): batch 2 - day and meal typing + meal factory
- `77a080eb` — refactor(di): batch 2 - macro-profile service & usecases factories + shims
- `b882ae3b` — refactor(di): batch 2 - macro-profile factories + shims
- `78e9ad7e` — refactor(di): batch 2 - dayUseCases factory + shim
- `fad6fb6e` — refactor(di): batch 2 - dedupe DayUseCases export

Observações / notas rápidas
- Estratégia aplicada: converter módulos para factories e manter shims até migrar consumidores. Isso mantém o código rodando e testes verdes durante a migração gradual.
- Após a sua ação de "comprimir a conversa" e retomar, prossigo com Batch 3 (vou manter a estratégia padrão de manter shims para minimizar impacto — altere se quiser injetar dependências imediatamente).
- Se preferir, posso também gerar um arquivo `.github/di-migration-checklist.md` com o mesmo checklist para tracking no repo.

---

Assistant migration snapshot (recorded progress)
- Short summary
  - Pattern applied: convert application modules to DI-friendly factories `createXxx(...)` and keep backward-compatible shims `export const xxx = createXxx(...)` while migrating consumers incrementally.
  - Commits are small and frequent; `npm run copilot:check` (lint + tsc + tests) was run after each change set.

- Batches completed (so far)
  - Batch 0 — Preparation DI: done (container & providers ready).
  - Batch 1 — Auth & User: done (user/auth use-cases converted & wired).
  - Batch 2 — Diet core: done (recipes/food/meal/macro-profile converted).
  - Batch 3 — Day-diet, template, template-search: done (factories + shims; pure template functions left unchanged).
  - Batch 4 — Weight: partial — `weightUseCases` converted to `createWeightUseCases` + shim.
  - Batch 5 — Toast / Recent-food / Clipboard: partial — `toastManager`, `recentFoodCrud`, `clipboardUseCases` converted to factories + shims.

- Files modified (high-level)
  - Day-diet:
    - `src/modules/diet/day-diet/application/usecases/createBlankDay.ts` — `createCreateBlankDay` + shim.
    - `src/modules/diet/day-diet/application/usecases/dayEditOrchestrator.ts` — `createDayEditOrchestrator` + shim.
    - `src/modules/diet/day-diet/application/usecases/useCopyDayOperations.ts` — `createCopyDayOperations` + shim.
  - Template / Template-search:
    - `src/modules/diet/template/application/templateToItem.ts` — pure/domain (reviewed).
    - `src/modules/diet/template/application/createGroupFromTemplate.ts` — pure/domain (reviewed).
    - `src/modules/template-search/application/templateSearchLogic.ts` — pure logic (reviewed).
    - `src/modules/template-search/application/usecases/templateSearchState.ts` — `createTemplateSearchState` + shim.
  - Weight:
    - `src/modules/weight/application/weight/usecases/weightUseCases.ts` — `createWeightUseCases` + shim.
  - Toast:
    - `src/modules/toast/application/toastManager.ts` — `createToastManager` factory; top-level wrappers call the factory at call-time to keep tests/spies working.
  - Recent-food:
    - `src/modules/recent-food/application/usecases/recentFoodCrud.ts` — `createRecentFoodCrud` + shim.
  - Clipboard:
    - `src/modules/clipboard/application/usecases/clipboardUseCases.ts` — `createClipboardUseCases` + shim.

- Important commits (recent)
  - `0d22e1f8` — batch-3 day-diet & template-search changes
  - `2cdecde1` — docs update (marked Batch 3 completed)
  - `207f7220` — batch-4 weight usecases factory + shim
  - `b7247c22` — batch-5 toast manager factory + shim
  - `5f81d81c` — batch-5 recent-food CRUD factory + shim
  - `fbba9d19` — batch-5 clipboard usecases factory + shim

- Verification status
  - After each set of edits I ran `npm run copilot:check`. Final recorded state: all checks passed (lint/ts/tests) at the last commit; 562 tests green.

- Design notes & rationale
  - Keep shims for backward compatibility and stepwise consumer migration.
  - Create signals/resources inside `createRoot` when needed to respect Solid lifecycle and reactivity lint.
  - Avoid introducing barrel files (index.ts) or changing import conventions; keep absolute `~/` imports.
  - Prefer explicit types and avoid unsafe `any` or unchecked conditionals.

How to resume (exact lines you can paste to resume)
- Minimal resume command:
  - "Resume: continue Batch 6"
- Specific-file resume:
  - "Resume: migrate src/modules/observability/application/telemetry.ts"
  - "Resume: migrate src/modules/profile/application/profile.ts"
  - "Resume: migrate src/modules/search/application/usecases/cachedSearchCrud.ts"
- Default behavior on resume:
  - I will continue converting files in the chosen batch to the factory+shim pattern, run `npm run copilot:check` after each logical change, commit frequently with messages like:
    - `refactor(di): batch-6 - <module-name> factory + shim`
  - I will update this `DI-migration-plan.md` checklist as I complete files.

Notes before you reset the conversation
- The file `DI-migration-plan.md` is already updated to reflect Batch 3 completion.
- If you want a separate artifact for CI tracking, tell me to generate `.github/di-migration-checklist.md` and I will produce it.
- When you come back, paste one of the resume lines above and I will continue exactly where I left off.
