import { untrack } from 'solid-js'

import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export function createRecipeCacheManagementService(deps: {
  getExistingRecipes: () => readonly Recipe[]
  clearCache: () => void
  fetchUserRecipes: (userId: User['uuid']) => void
}) {
  return ({ userId }: { userId: User['uuid'] }) => {
    logging.debug(`Effect - Refetch/Manage recipe cache`)
    const existingRecipes = untrack(deps.getExistingRecipes)

    // If any recipe is from other user, purge cache
    if (existingRecipes.find((r) => r.user_id !== userId) !== undefined) {
      logging.debug(`User changed! Purge recipe cache`)
      deps.clearCache()
      void deps.fetchUserRecipes(userId)
      return
    }

    logging.debug(
      `Recipe cache effect - user: ${userId}, cache size: ${existingRecipes.length}`,
    )
  }
}
