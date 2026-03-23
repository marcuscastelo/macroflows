import { createEffect, createMemo, createRoot, createSignal } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createClipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { createDayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import { initializeMacroProfileState } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { macroProfileUseCases } from '~/modules/diet/macro-profile/application/usecases/macroProfileUseCases'
import { createTelemetry } from '~/modules/observability/application/telemetry'
import { initializeSentry } from '~/modules/observability/infrastructure/sentry/sentry'
import { createProfile } from '~/modules/profile/application/profile'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { createWeightChartUseCases } from '~/modules/weight/application/chart/weightChartUseCases'
import {
  createWeightUseCases,
  type WeightUseCases,
} from '~/modules/weight/application/weight/usecases/weightUseCases'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

type AppMode = 'guest' | 'normal'

// Re-export use-case types for consumers
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

  const telemetryUseCases = createMemo(() =>
    createTelemetry({
      initializeSentry,
    }),
  )

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
    telemetryUseCases,
    userUseCases,
    guestUseCases,
    authUseCases,
  }
})

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

const profileUseCasesInstance = createRoot(() => {
  return createProfile({
    userUseCases: () => coreContainer.userUseCases(),
  })
})

/**
 * Create clipboard use-cases after core container is established.
 */
const clipboardUseCasesInstance = createRoot(() => {
  return createClipboardUseCases()
})

const daysUseCasesInstance = createRoot(() => {
  return createDayUseCases({
    authUseCases: () => coreContainer.authUseCases(),
  })
})

/**
 * Full use-cases container with all modules wired.
 */
export const useCases = {
  telemetryUseCases: coreContainer.telemetryUseCases,
  userUseCases: coreContainer.userUseCases,
  guestUseCases: coreContainer.guestUseCases,
  authUseCases: coreContainer.authUseCases,
  profileUseCases: () => profileUseCasesInstance,
  weightUseCases: () => weightUseCasesInstance,
  weightChartUseCases: () => weightChartUseCasesInstance,
  clipboardUseCases: () => clipboardUseCasesInstance,
  dayUseCases: () => daysUseCasesInstance,
}
