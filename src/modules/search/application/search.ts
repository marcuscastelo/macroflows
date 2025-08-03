import { createResource, createSignal } from 'solid-js'

import {
  fetchFoods,
  fetchFoodsByName,
} from '~/modules/diet/food/application/food'
import {
  fetchUserRecipeByName,
  fetchUserRecipes,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { fetchUserRecentFoods } from '~/modules/recent-food/application/recentFood'
import { fetchTemplatesByTabLogic } from '~/modules/search/application/searchLogic'
import { currentUser, currentUserId } from '~/modules/user/application/user'
import { type TemplateSearchTab } from '~/sections/search/components/TemplateSearchTabs'
import { createDebouncedSignal } from '~/shared/utils/createDebouncedSignal'

export const DEFAULT_DEBOUNCE_MS = 500

export const [templateSearch, setTemplateSearch] = createSignal<string>('')
export const [debouncedSearch] = createDebouncedSignal(
  templateSearch,
  DEFAULT_DEBOUNCE_MS,
)
export const [templateSearchTab, setTemplateSearchTab] =
  createSignal<TemplateSearchTab>('hidden')
export const [debouncedTab] = createDebouncedSignal(
  templateSearchTab,
  DEFAULT_DEBOUNCE_MS,
)

const getFavoriteFoods = () => currentUser()?.favorite_foods ?? []

export const [
  templates,
  { refetch: refetchTemplates, mutate: mutateTemplates },
] = createResource(
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
