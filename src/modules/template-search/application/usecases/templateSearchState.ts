import { createResource, createSignal } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import {
  fetchFoods,
  fetchFoodsByName,
} from '~/modules/diet/food/application/usecases/foodCrud'
import { recentFoodUseCases } from '~/modules/diet/recent-food/application/usecases/recentFoodUseCases'
import {
  fetchUserRecipeByName,
  fetchUserRecipes,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export const [templateSearch, setTemplateSearch] = createSignal<string>('')
export const [debouncedSearch] = createDebouncedSignal(templateSearch, 500)
export const [templateSearchTab, setTemplateSearchTab] =
  createSignal<TemplateSearchTab>('hidden')
export const [debouncedTab] = createDebouncedSignal(templateSearchTab, 500)

const getFavoriteFoods = () => userUseCases.currentUser()?.favorite_foods ?? []

export const [templates, { refetch: refetchTemplates }] = createResource(
  () => ({
    tab: debouncedTab(),
    search: debouncedSearch(),
    userId: authUseCases.currentUserIdOrGuestId(),
  }),
  (signals) => {
    return fetchTemplatesByTabLogic(
      signals.tab,
      signals.search,
      signals.userId,
      {
        // TODO: Convert fetchTemplatesByTabLogic deps to reactive signals?
        fetchUserRecipes,
        fetchUserRecipeByName,
        fetchUserRecentFoodsAsTemplates:
          recentFoodUseCases.fetchUserRecentFoodsAsTemplates,
        fetchFoods,
        fetchFoodsByName,
        getFavoriteFoods,
      },
    )
  },
)
