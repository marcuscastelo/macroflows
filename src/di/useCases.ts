import { createEffect, createMemo, createRoot, createSignal } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createClipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
/**
 * Macro-profile state initializer.
 *
 * The macro-profile module exposes an `initializeMacroProfileState` function
 * which must be called once the auth/use-cases are available. Wire it here so
 * the DI container is responsible for starting module-level reactive effects.
 */
import { initializeMacroProfileState } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { macroProfileUseCases } from '~/modules/diet/macro-profile/application/usecases/macroProfileUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import {
  createWeightChartUseCases,
  type WeightChartUseCases,
} from '~/modules/weight/application/chart/weightChartUseCases'
import {
  createWeightUseCases,
  type WeightUseCases,
} from '~/modules/weight/application/weight/usecases/weightUseCases'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

export type AppMode = 'guest' | 'normal'

// Re-export use-case types for consumers
export type { WeightChartUseCases, WeightUseCases }

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
    const isGuest = guestUseCases().isGuestMode()
    setMode(isGuest ? 'guest' : 'normal')
  })

  return {
    userUseCases,
    guestUseCases,
    authUseCases,
  }
})

// Initialize macro-profile state reactive effects that depend on the auth use-cases.
// This wires the module-level effects (cache clearing / profile fetching) so the
// macro-profile module does not try to read the global DI container during module
// evaluation and avoids TDZ/circular import issues.
initializeMacroProfileState({
  getAuthUseCases: () => coreContainer.authUseCases(),
  macroProfileUseCases,
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
 * Create weight chart use-cases after weight use-cases are established.
 * Uses granular dependencies to avoid circular dependency.
 */
const weightChartUseCasesInstance = createRoot(() => {
  return createWeightChartUseCases({
    getDesiredWeight: () =>
      coreContainer.userUseCases().currentUser()?.desired_weight ?? 0,
    getDiet: () => coreContainer.userUseCases().currentUser()?.diet ?? 'cut',
    weightUseCases: weightUseCasesInstance,
  })
})

/**
 * Create clipboard use-cases after core container is established.
 */
const clipboardUseCasesInstance = createRoot(() => {
  return createClipboardUseCases()
})

/**
 * Full use-cases container with all modules wired.
 */
export const useCases = {
  userUseCases: coreContainer.userUseCases,
  guestUseCases: coreContainer.guestUseCases,
  authUseCases: coreContainer.authUseCases,
  weightUseCases: () => weightUseCasesInstance,
  weightChartUseCases: () => weightChartUseCasesInstance,
  clipboardUseCases: () => clipboardUseCasesInstance,
}
