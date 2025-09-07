import { untrack } from 'solid-js'

import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

export function createRecipeCacheManagementService(deps: {
  getExistingRecipes: () => readonly Recipe[]
  clearCache: () => void
  fetchUserRecipes: (userId: number) => void
}) {
  return ({ userId }: { userId: number }) => {
    debug(`Effect - Refetch/Manage recipe cache`)
    const existingRecipes = untrack(deps.getExistingRecipes)

    // If any recipe is from other user, purge cache
    if (existingRecipes.find((r) => r.owner !== userId) !== undefined) {
      debug(`User changed! Purge recipe cache`)
      deps.clearCache()
      void deps.fetchUserRecipes(userId)
      return
    }

    debug(
      `Recipe cache effect - user: ${userId}, cache size: ${existingRecipes.length}`,
    )
  }
}
