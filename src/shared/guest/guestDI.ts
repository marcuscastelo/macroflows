import { createEffect, createRoot, createSignal, onMount } from 'solid-js'

import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { createGuestStore } from '~/shared/guest/store/guestStore'

export function createGuestDI() {
  return createRoot(() => {
    const guestStore = createGuestStore()

    const [authUseCases, setAuthUseCases] = createSignal({
      currentUserIdOrGuestId: () => String(GUEST_USER_ID),
      signOut: async () => {},
    })

    createEffect(() => {
      const isGuest = authUseCases().currentUserIdOrGuestId() === GUEST_USER_ID
      guestStore.setGuestModeEnabled(isGuest)
    })

    onMount(() => {
      async function loadAuthUseCases() {
        const { authUseCases } =
          // eslint-disable-next-line no-restricted-syntax
          await import('~/modules/auth/application/usecases/authUseCases')

        setAuthUseCases(() => ({
          currentUserIdOrGuestId: authUseCases.currentUserIdOrGuestId,
          signOut: authUseCases.signOut,
        }))
      }

      loadAuthUseCases().catch((error) => {
        console.error('Failed to load auth use cases:', error)
      })
    })

    return { guestStore, authUseCases }
  })
}
