import { createSignal } from 'solid-js'

import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

const [recipes, setRecipes] = createSignal<readonly Recipe[]>([])

export const recipeCacheStore = {
  getRecipes: recipes,
  setRecipes,

  upsertToCache: (recipe: Recipe) => {
    setRecipes((current) => {
      const existingIndex = current.findIndex((r) => r.id === recipe.id)
      if (existingIndex >= 0) {
        const updated = [...current]
        updated[existingIndex] = recipe
        return updated
      }
      return [...current, recipe]
    })
  },

  removeFromCache: (criteria: { by: 'id'; value: Recipe['id'] }) => {
    setRecipes((current) => current.filter((r) => r.id !== criteria.value))
  },

  clearCache: () => {
    setRecipes([])
  },

  findInCache: (criteria: { by: 'id'; value: Recipe['id'] }) => {
    const current = recipes()
    return current.find((r) => r.id === criteria.value) ?? null
  },
}
