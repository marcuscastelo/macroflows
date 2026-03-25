import { createResource, createRoot, createSignal } from 'solid-js'

import { type FoodCrud } from '~/modules/diet/food/application/usecases/foodCrud'
import { type RecipeCrud } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { type RecentFoodCrud } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export function createTemplateSearchState(deps: {
  getCurrentUserIdOrGuestId: () => string | undefined
  getFavoriteFoods: () => number[]
  recentFoodCrud: RecentFoodCrud
  foodCrud: FoodCrud
  recipeCrud: RecipeCrud
}) {
  return createRoot(() => {
    const recentFoodCrud = deps.recentFoodCrud
    const foodCrud = deps.foodCrud
    const recipeCrud = deps.recipeCrud

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
