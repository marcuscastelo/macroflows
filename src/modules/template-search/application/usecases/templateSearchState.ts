import { createResource, createSignal } from 'solid-js'

import {
  fetchFoods,
  fetchFoodsByName,
} from '~/modules/diet/food/application/usecases/foodCrud'
import {
  fetchUserRecipeByName,
  fetchUserRecipes,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { fetchUserRecentFoods } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { type TemplateSearchTab } from '~/modules/search/ui/TemplateSearchTabs'
import { fetchTemplatesByTabLogic } from '~/modules/template-search/application/templateSearchLogic'
import { currentUser, currentUserId } from '~/modules/user/application/user'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export const [templateSearch, setTemplateSearch] = createSignal<string>('')
export const [debouncedSearch] = createDebouncedSignal(templateSearch, 500)
export const [templateSearchTab, setTemplateSearchTab] =
  createSignal<TemplateSearchTab>('hidden')
export const [debouncedTab] = createDebouncedSignal(templateSearchTab, 500)

const getFavoriteFoods = () => currentUser()?.favorite_foods ?? []

export const [templates, { refetch: refetchTemplates }] = createResource(
  () => ({
    tab: debouncedTab(),
    search: debouncedSearch(),
    userId: currentUserId(),
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
