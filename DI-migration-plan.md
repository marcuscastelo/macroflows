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

- [ ] Batch 3 — Day-diet, template, template-search (próximo)
  - [ ] `src/modules/diet/day-diet/application/usecases/createBlankDay.ts` — ajustar para injetar `dayUseCases` ou manter shim (decisão: manter shims por padrão, a menos que desejado o contrário).
  - [ ] `src/modules/diet/day-diet/application/usecases/dayEditOrchestrator.ts` — revisar e converter para factory pattern quando aplicável.
  - [ ] `src/modules/diet/template/application/createGroupFromTemplate.ts` — pendente (se existir no repositório).
  - [ ] `src/modules/diet/template/application/templateToItem.ts` — pendente.
  - [ ] `src/modules/template-search/application/templateSearchLogic.ts` — pendente.
  - [ ] `src/modules/template-search/application/usecases/templateSearchState.ts` — pendente.

- [ ] Batch 4 — Weight / Measure / Charts
  - [ ] (Arquivos listados no plano) — pendente.

- [ ] Batch 5 — Toast, Clipboard, Recent-food, Import/Export
  - [ ] (Arquivos listados no plano) — pendente.

- [ ] Batch 6 — Profile, Search, Observability, Misc
  - [ ] (Arquivos listados no plano) — pendente.

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
