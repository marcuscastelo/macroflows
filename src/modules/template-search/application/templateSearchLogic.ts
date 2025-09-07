// Unified, testable logic for fetching templates by tab
// All exported functions will have JSDoc

import type { Food } from '~/modules/diet/food/domain/food'
import type { FoodSearchParams } from '~/modules/diet/food/domain/foodRepository'
import type { Recipe } from '~/modules/diet/recipe/domain/recipe'
import type { Template } from '~/modules/diet/template/domain/template'
import { availableTabs } from '~/sections/search/components/TemplateSearchTabs'

/**
 * Dependencies for fetchTemplatesByTabLogic
 */
export type FetchTemplatesDeps = {
  fetchUserRecipes: (userId: number) => Promise<readonly Recipe[] | null>
  fetchUserRecipeByName: (
    userId: number,
    name: string,
  ) => Promise<readonly Recipe[] | null>
  fetchUserRecentFoods: (
    userId: number,
    search: string,
    opts?: { limit?: number },
  ) => Promise<readonly Template[]>
  fetchFoods: (opts: {
    limit?: number
    allowedFoods?: number[]
  }) => Promise<readonly Food[] | null>
  fetchFoodsByName: (
    name: string,
    opts: FoodSearchParams,
  ) => Promise<readonly Food[] | null>
  getFavoriteFoods: () => number[]
}

/**
 * Fetches templates (foods/recipes) for a given tab and search string.
 * @param tabId - The tab identifier
 * @param search - The search string
 * @param userId - The user id
 * @param deps - The dependencies for fetching data
 * @returns Array of templates matching the tab and search
 */
export async function fetchTemplatesByTabLogic(
  tabId: string,
  search: string,
  userId: number,
  deps: FetchTemplatesDeps,
): Promise<readonly Template[]> {
  const lowerSearch = search.trim().toLowerCase()
  switch (tabId) {
    case availableTabs.Recentes.id: {
      // Use the refactored function that returns Template objects directly
      const templates = await deps.fetchUserRecentFoods(userId, search)

      // Apply additional client-side filtering if needed (for EAN search)
      if (lowerSearch !== '') {
        return templates.filter((item) => matchesSearch(item, lowerSearch))
      }

      return templates
    }
    case availableTabs.Receitas.id: {
      if (lowerSearch === '') {
        return (await deps.fetchUserRecipes(userId)) ?? []
      } else {
        return (await deps.fetchUserRecipeByName(userId, search)) ?? []
      }
    }
    case availableTabs.Favoritos.id: {
      const allowedFoods = deps.getFavoriteFoods()
      const limit = undefined
      if (lowerSearch === '') {
        return (await deps.fetchFoods({ limit, allowedFoods })) ?? []
      } else {
        return (
          (await deps.fetchFoodsByName(search, {
            limit,
            userId,
            isFavoritesSearch: true,
          })) ?? []
        )
      }
    }
    case availableTabs.Todos.id:
    default: {
      const limit = DEFAULT_FETCH_LIMIT
      if (lowerSearch === '') {
        return (await deps.fetchFoods({ limit })) ?? []
      } else {
        return (await deps.fetchFoodsByName(search, { limit })) ?? []
      }
    }
  }
}

/**
 * Checks if a template matches the search term by name or EAN.
 * @param item - The template item to check
 * @param search - The search term (case-insensitive)
 * @returns True if the item matches the search term
 */
function matchesSearch(
  item: { name: string; ean?: string | null },
  search: string,
): boolean {
  const lowerSearch = search.toLowerCase()

  if (item.name.toLowerCase().includes(lowerSearch)) return true

  if (
    typeof item.ean === 'string' &&
    item.ean &&
    item.ean.toLowerCase().includes(lowerSearch)
  ) {
    return true
  }

  return false
}

/**
 * Default fetch limit for the 'Todos' tab.
 */
const DEFAULT_FETCH_LIMIT = 50
