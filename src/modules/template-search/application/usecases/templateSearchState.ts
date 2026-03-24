import { useCases } from '~/di/useCases'
import { createResource, createRoot, createSignal } from 'solid-js'

import {
  createFoodCrud,
  type FoodCrud,
} from '~/modules/diet/food/application/usecases/foodCrud'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import {
  createRecipeCrud,
  type RecipeCrud,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { createRecipeRepository } from '~/modules/diet/recipe/infrastructure/recipeRepository'
import {
  createRecentFoodCrud,
  type RecentFoodCrud,
} from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export function createTemplateSearchState(deps: {
  getCurrentUserIdOrGuestId: () => string | undefined
  getFavoriteFoods: () => number[]
  recentFoodCrud?: RecentFoodCrud
  foodCrud?: FoodCrud
  recipeCrud?: RecipeCrud
}) {
  return createRoot(() => {
    const recentFoodCrud = deps.recentFoodCrud ?? createRecentFoodCrud()
    const foodCrud =
      deps.foodCrud ??
      createFoodCrud({ repository: () => createSupabaseFoodRepository() })
    const recipeCrud =
      deps.recipeCrud ??
      createRecipeCrud({
        repository: () => createRecipeRepository(),
      })

    const [templateSearch, setTemplateSearch] = createSignal<string>('')
    const [debouncedSearch] = createDebouncedSignal(templateSearch, 500)
    const [templateSearchTab, setTemplateSearchTab] =
      createSignal<TemplateSearchTab>('hidden')
    const [debouncedTab] = createDebouncedSignal(templateSearchTab, 500)

    const [templates, { refetch: refetchTemplates }] = createResource(
      () => ({
        tab: debouncedTab(),
        search: debouncedSearch(),
        userId: deps.getCurrentUserIdOrGuestId(),
      }),
      (signals) =>
        fetchTemplatesByTabLogic(signals.tab, signals.search, signals.userId, {
          fetchUserRecipes: (userId) => recipeCrud.fetchUserRecipes(userId),
          fetchUserRecipeByName: (userId, name) =>
            recipeCrud.fetchUserRecipeByName(userId, name),
          fetchUserRecentFoodsAsTemplates: recentFoodCrud.fetchUserRecentFoods,
          fetchFoods: (params) => foodCrud.fetchFoods(params),
          fetchFoodsByName: (name, params) =>
            foodCrud.fetchFoodsByName(name, params),
          getFavoriteFoods: deps.getFavoriteFoods,
        }),
    )

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

export type TemplateSearchState = ReturnType<typeof createTemplateSearchState>

const _defaultTemplateSearchState = createTemplateSearchState({
  getCurrentUserIdOrGuestId: () => useCases.authUseCases().currentUserIdOrGuestId(),
  getFavoriteFoods: () =>
    useCases.userUseCases().currentUser()?.favorite_foods ?? [],
})

export const templateSearch = _defaultTemplateSearchState.templateSearch
export const setTemplateSearch = _defaultTemplateSearchState.setTemplateSearch
export const debouncedSearch = _defaultTemplateSearchState.debouncedSearch
export const templateSearchTab = _defaultTemplateSearchState.templateSearchTab
export const setTemplateSearchTab =
  _defaultTemplateSearchState.setTemplateSearchTab
export const debouncedTab = _defaultTemplateSearchState.debouncedTab
export const templates = _defaultTemplateSearchState.templates
export const refetchTemplates = _defaultTemplateSearchState.refetchTemplates

export { _defaultTemplateSearchState as templateSearchState }
