import { createRoot } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

const container = createRoot(() => {
  const container = {
    authUseCases: () => createAuthUseCases(container),
    userUseCases: () => createUserUseCases(),
    guestUseCases: () => createGuestUseCases(container),
  }

  return container
})

export const useCases = {
  ...container,
}
