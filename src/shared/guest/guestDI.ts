import { createEffect } from 'solid-js'

import { type createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { createGuestStore } from '~/shared/guest/store/guestStore'

export type GuestDI = {
  authUseCases: () => ReturnType<typeof createAuthUseCases>
}

export function createGuestDI(di: GuestDI) {
  const guestStore = createGuestStore()
  const authUseCases = di.authUseCases()

  createEffect(() => {
    const isGuest = authUseCases.currentUserIdOrGuestId() === GUEST_USER_ID
    guestStore.setGuestModeEnabled(isGuest)
  })

  return { guestStore, authUseCases }
}
