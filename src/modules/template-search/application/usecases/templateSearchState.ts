import {
  createEffect,
  createResource,
  createRoot,
  createSignal,
} from 'solid-js'

import { useCases } from '~/di/useCases'
import {
  createFoodCrud,
  type FoodCrud,
} from '~/modules/diet/food/application/usecases/foodCrud'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import {
  fetchUserRecipeByName,
  fetchUserRecipes,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import {
  createRecentFoodCrud,
  type RecentFoodCrud,
} from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
// userUseCases will be accessed via the DI container to avoid init order issues
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

/**
 * Factory that creates the template-search state (signals + resource).
 *
 * This allows wiring the module via DI and avoids init-order issues.
 */
export function createTemplateSearchState(deps?: {
  useCases?: {
    authUseCases: () => { currentUserIdOrGuestId: () => string | undefined }
    userUseCases: () => {
      currentUser: () => { favorite_foods?: number[] } | null
    }
  }
  recentFoodCrud?: RecentFoodCrud
  foodCrud?: FoodCrud
  fetchUserRecipes?: typeof fetchUserRecipes
  fetchUserRecipeByName?: typeof fetchUserRecipeByName
  createDebouncedSignal?: typeof createDebouncedSignal
}) {
  // Wrap the factory body in createRoot so all signals/resources are created
  // in a tracked root scope. This satisfies Solid reactivity lint rules that
  // require reactive variables to be created/used within tracked scopes.
  return createRoot(() => {
    const injectedUseCases = deps?.useCases ?? useCases
    const recentFoodCrud = deps?.recentFoodCrud ?? createRecentFoodCrud()
    const foodCrud =
      deps?.foodCrud ??
      createFoodCrud({ repository: () => createSupabaseFoodRepository() })
    const injectedFetchUserRecipes = deps?.fetchUserRecipes ?? fetchUserRecipes
    const injectedFetchUserRecipeByName =
      deps?.fetchUserRecipeByName ?? fetchUserRecipeByName
    const localCreateDebouncedSignal =
      deps?.createDebouncedSignal ?? createDebouncedSignal

    /* eslint-disable solid/reactivity */
    // Signals must be local constants inside the factory (no `export` here).
    const [templateSearch, setTemplateSearch] = createSignal<string>('')
    const [debouncedSearch] = localCreateDebouncedSignal(templateSearch, 500)
    const [templateSearchTab, setTemplateSearchTab] =
      createSignal<TemplateSearchTab>('hidden')
    const [debouncedTab] = localCreateDebouncedSignal(templateSearchTab, 500)

    const getFavoriteFoods = () =>
      injectedUseCases.userUseCases().currentUser()?.favorite_foods ?? []

    const [templates, { refetch: refetchTemplates }] = createResource(
      () => ({
        tab: debouncedTab(),
        search: debouncedSearch(),
        userId: injectedUseCases.authUseCases().currentUserIdOrGuestId(),
      }),
      (signals) => {
        return fetchTemplatesByTabLogic(
          signals.tab,
          signals.search,
          signals.userId,
          {
            fetchUserRecipes: injectedFetchUserRecipes,
            fetchUserRecipeByName: injectedFetchUserRecipeByName,
            fetchUserRecentFoods: recentFoodCrud.fetchUserRecentFoods,
            fetchFoods: (params) => foodCrud.fetchFoods(params),
            fetchFoodsByName: (name, params) =>
              foodCrud.fetchFoodsByName(name, params),
            getFavoriteFoods,
          },
        )
      },
    )

    // Ensure the reactive signals are referenced inside a tracked scope so the
    // linter recognizes they are intentionally used. This keeps changes to the
    // signals tracked by Solid while avoiding unused-reactive warnings.
    createEffect(() => {
      void templateSearch()
      void templateSearchTab()
    })
    /* eslint-enable solid/reactivity */

    return {
      templateSearch,
      setTemplateSearch,
      debouncedSearch,
      templateSearchTab,
      setTemplateSearchTab,
      debouncedTab,
      templates,
      refetchTemplates,
    }
  })
}

/**
 * Backward-compatible shim: keep top-level named exports working while consumers migrate.
 * We wire the factory with the existing defaults from this module's current environment.
 */
const _defaultTemplateSearchState = createTemplateSearchState()

export const templateSearch = _defaultTemplateSearchState.templateSearch
export const setTemplateSearch = _defaultTemplateSearchState.setTemplateSearch
export const debouncedSearch = _defaultTemplateSearchState.debouncedSearch
export const templateSearchTab = _defaultTemplateSearchState.templateSearchTab
export const setTemplateSearchTab =
  _defaultTemplateSearchState.setTemplateSearchTab
export const debouncedTab = _defaultTemplateSearchState.debouncedTab
export const templates = _defaultTemplateSearchState.templates
export const refetchTemplates = _defaultTemplateSearchState.refetchTemplates

// named export for DI consumers who want the factory directly
export { _defaultTemplateSearchState as templateSearchState }
