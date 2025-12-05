import { createEffect, createMemo, createRoot, createSignal } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

export type AppMode = 'guest' | 'normal'

const container = createRoot(() => {
  // TODO: Refactor global DI so that guestMode signal is not in the global DI container
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
    const isGuest = authUseCases().currentUserIdOrGuestId() === 'guest-user-id'
    setMode(isGuest ? 'guest' : 'normal')
  })

  function container() {
    return {
      userUseCases,
      guestUseCases,
      authUseCases,
    }
  }

  return container()
})

// TODO: Refactor global DI so that we don't need to switch repositories like this
function getUserRepository(mode: AppMode): UserRepository {
  return mode === 'guest'
    ? createGuestUserRepository()
    : createSupabaseUserRepository()
}

export const useCases = {
  ...container,
}
