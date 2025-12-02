import { createEffect, createRoot } from 'solid-js'

import { createRecipeCacheManagementService } from '~/modules/diet/recipe/application/services/cacheManagement'
import { fetchUserRecipes } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { recipeCacheStore } from '~/modules/diet/recipe/infrastructure/signals/recipeCacheStore'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { logging } from '~/shared/utils/logging'

const runCacheManagement = createRecipeCacheManagementService({
  getExistingRecipes: () => recipeCacheStore.getRecipes(),
  clearCache: recipeCacheStore.clearCache,
  fetchUserRecipes: (userId) => void fetchUserRecipes(userId),
})

let initialized = false
export function initializeRecipeEffects() {
  if (initialized) {
    return
  }
  initialized = true
  return createRoot(() => {
    createEffect(() => {
      const userId = userUseCases.currentUserId_unsafe()
      logging.debug(`Recipe cache effect - user changed to ${userId}`)

      runCacheManagement({ userId })
    })
  })
}
