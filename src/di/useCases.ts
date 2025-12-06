import { createEffect, createMemo, createRoot, createSignal } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import {
  createWeightUseCases,
  type WeightUseCases,
} from '~/modules/weight/application/weight/usecases/weightUseCases'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

export type AppMode = 'guest' | 'normal'

// Re-export WeightUseCases type for consumers
export type { WeightUseCases }

// TODO: Refactor global DI so that we don't need to switch repositories like this
// Issue URL: https://github.com/marcuscastelo/macroflows/issues/1440
function getUserRepository(mode: AppMode): UserRepository {
  return mode === 'guest'
    ? createGuestUserRepository()
    : createSupabaseUserRepository()
}

/**
 * Core container with auth/user/guest use-cases.
 * Weight use-cases are added separately to avoid circular dependency.
 */
const coreContainer = createRoot(() => {
  // TODO: Refactor global DI so that guestMode signal is not in the global DI container
  // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1441
  const [mode, setMode] = createSignal<AppMode>('normal')

  const userUseCases = createMemo(() =>
    createUserUseCases({
      repository: () => getUserRepository(mode()),
    }),
  )

  const authUseCases = createMemo(() =>
    createAuthUseCases({
      userUseCases: () => userUseCases(),
    }),
  )

  const guestUseCases = createMemo(() =>
    createGuestUseCases({
      authUseCases: () => authUseCases(),
    }),
  )

  createEffect(() => {
    const isGuest =
      authUseCases().currentUserIdOrGuestId() === GUEST_USER_ID &&
      guestUseCases().hasAcceptedGuestTerms()
    setMode(isGuest ? 'guest' : 'normal')
  })

  return {
    userUseCases,
    guestUseCases,
    authUseCases,
  }
})

/**
 * Create weight use-cases after core container is established.
 * Uses granular authDeps to avoid circular dependency.
 */
const weightUseCasesInstance = createRoot(() => {
  return createWeightUseCases({
    authDeps: {
      getCurrentUserIdOrGuestId: () =>
        coreContainer.authUseCases().currentUserIdOrGuestId(),
      isGuestMode: () => coreContainer.guestUseCases().isGuestMode(),
    },
  })
})

/**
 * Full use-cases container with all modules wired.
 */
export const useCases = {
  userUseCases: coreContainer.userUseCases,
  guestUseCases: coreContainer.guestUseCases,
  authUseCases: coreContainer.authUseCases,
  weightUseCases: () => weightUseCasesInstance,
}
