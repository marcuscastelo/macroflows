import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createNewFood,
  promoteNewFoodToFood,
} from '~/modules/diet/food/domain/food'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  createNewRecipe,
  promoteRecipe,
} from '~/modules/diet/recipe/domain/recipe'
import {
  fetchTemplatesByTabLogic,
  type FetchTemplatesDeps,
} from '~/modules/search/application/usecases/templateSearchLogic'
import { availableTabs } from '~/modules/search/ui/TemplateSearchTabs'

describe('fetchTemplatesByTabLogic', () => {
  const mockFood = promoteNewFoodToFood(
    createNewFood({
      name: 'Banana',
      ean: '123',
      macros: createMacroNutrients({
        carbs: 25,
        protein: 2,
        fat: 0.5,
      }),
    }),
    { id: 1 },
  )
  const mockRecipe = promoteRecipe(
    createNewRecipe({
      name: 'Bolo',
      user_id: '',
      items: [],
      prepared_multiplier: 1,
    }),
    { id: 2 },
  )
  const userId = '1'
  let deps: FetchTemplatesDeps

  beforeEach(() => {
    deps = {
      fetchUserRecipes: vi.fn().mockResolvedValue([mockRecipe]),
      fetchUserRecipeByName: vi.fn().mockResolvedValue([mockRecipe]),
      fetchUserRecentFoods: vi.fn().mockResolvedValue([mockFood, mockRecipe]),
      fetchFoods: vi.fn().mockResolvedValue([mockFood]),
      fetchFoodsByName: vi.fn().mockResolvedValue([mockFood]),
      getFavoriteFoods: () => [1],
    }
  })

  it('fetches recipes for Receitas tab', async () => {
    const result = await fetchTemplatesByTabLogic(
      availableTabs.Receitas.id,
      '',
      userId,
      deps,
    )
    expect(result).toEqual([mockRecipe])
  })

  it('fetches recipes by name for Receitas tab', async () => {
    const result = await fetchTemplatesByTabLogic(
      availableTabs.Receitas.id,
      'Bolo',
      userId,
      deps,
    )
    expect(result).toEqual([mockRecipe])
  })

  it('fetches recent foods and recipes for Recentes tab', async () => {
    const result = await fetchTemplatesByTabLogic(
      availableTabs.Recentes.id,
      '',
      userId,
      deps,
    )
    expect(result).toEqual([mockFood, mockRecipe])
    // Verify that fetchUserRecentFoods was called with correct parameters
    expect(deps.fetchUserRecentFoods).toHaveBeenCalledWith(userId, '')
  })

  it('fetches favorite foods for Favoritos tab', async () => {
    const result = await fetchTemplatesByTabLogic(
      availableTabs.Favoritos.id,
      '',
      userId,
      deps,
    )
    expect(result).toEqual([mockFood])
  })

  it('fetches foods for Todos tab', async () => {
    const result = await fetchTemplatesByTabLogic(
      availableTabs.Todos.id,
      '',
      userId,
      deps,
    )
    expect(result).toEqual([mockFood])
  })

  it('filters by search string in Recentes tab', async () => {
    // Mock the function to return only the food template for search "Banana"
    deps.fetchUserRecentFoods = vi.fn().mockResolvedValue([mockFood])

    const result = await fetchTemplatesByTabLogic(
      availableTabs.Recentes.id,
      'Banana',
      userId,
      deps,
    )
    expect(result).toEqual([mockFood])
    expect(deps.fetchUserRecentFoods).toHaveBeenCalledWith(userId, 'Banana')
  })

  it('filters by EAN in Recentes tab', async () => {
    // The EAN search should filter client-side since the database function only searches by name
    // Mock the function to return both templates, then expect client-side filtering to work
    deps.fetchUserRecentFoods = vi
      .fn()
      .mockResolvedValue([mockFood, mockRecipe])

    const result = await fetchTemplatesByTabLogic(
      availableTabs.Recentes.id,
      mockFood.ean!,
      userId,
      deps,
    )
    expect(result).toEqual([mockFood])
    expect(deps.fetchUserRecentFoods).toHaveBeenCalledWith(
      userId,
      mockFood.ean!,
    )
  })

  it('calls fetchFoodsByName with correct args for Todos tab and non-empty search', async () => {
    const search = 'Banana'
    await fetchTemplatesByTabLogic(availableTabs.Todos.id, search, userId, deps)
    expect(deps.fetchFoodsByName).toHaveBeenCalledWith(search, { limit: 50 })
  })

  it('calls fetchFoodsByName with userId and isFavoritesSearch for Favoritos tab and non-empty search', async () => {
    const search = 'Banana'
    const favoriteFoods = [1, 2, 3]
    deps.getFavoriteFoods = () => favoriteFoods

    await fetchTemplatesByTabLogic(
      availableTabs.Favoritos.id,
      search,
      userId,
      deps,
    )

    expect(deps.fetchFoodsByName).toHaveBeenCalledWith(search, {
      limit: undefined,
      userId,
      isFavoritesSearch: true,
    })
  })

  it('calls fetchFoods with allowedFoods for Favoritos tab and empty search', async () => {
    const favoriteFoods = [1, 2, 3]
    deps.getFavoriteFoods = () => favoriteFoods

    await fetchTemplatesByTabLogic(availableTabs.Favoritos.id, '', userId, deps)

    expect(deps.fetchFoods).toHaveBeenCalledWith({
      limit: undefined,
      allowedFoods: favoriteFoods,
    })
  })
})
