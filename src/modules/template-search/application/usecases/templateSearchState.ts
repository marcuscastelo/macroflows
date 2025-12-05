import { createResource, createSignal } from 'solid-js'

import { useCases } from '~/di/useCases'
import {
  fetchFoods,
  fetchFoodsByName,
} from '~/modules/diet/food/application/usecases/foodCrud'
import {
  fetchUserRecipeByName,
  fetchUserRecipes,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { fetchUserRecentFoods } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
// userUseCases will be accessed via the DI container to avoid init order issues
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export const [templateSearch, setTemplateSearch] = createSignal<string>('')
export const [debouncedSearch] = createDebouncedSignal(templateSearch, 500)
export const [templateSearchTab, setTemplateSearchTab] =
  createSignal<TemplateSearchTab>('hidden')
export const [debouncedTab] = createDebouncedSignal(templateSearchTab, 500)

const getFavoriteFoods = () =>
  useCases.userUseCases().currentUser()?.favorite_foods ?? []

export const [templates, { refetch: refetchTemplates }] = createResource(
  () => ({
    tab: debouncedTab(),
    search: debouncedSearch(),
    userId: useCases.authUseCases().currentUserIdOrGuestId(),
  }),
  (signals) => {
    return fetchTemplatesByTabLogic(
      signals.tab,
      signals.search,
      signals.userId,
      {
        fetchUserRecipes,
        fetchUserRecipeByName,
        fetchUserRecentFoods,
        fetchFoods,
        fetchFoodsByName,
        getFavoriteFoods,
      },
    )
  },
)
