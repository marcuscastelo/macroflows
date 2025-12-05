import { createMemo, createRoot } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { createGuestUseCases } from '~/shared/guest/guestUseCases'

const container = createRoot(() => {
  const userUseCasesFactory = () => createUserUseCases()
  const userUseCases = createMemo(userUseCasesFactory)

  const authUseCasesFactory = () => createAuthUseCases({ userUseCases })
  const authUseCases = createMemo(authUseCasesFactory)

  const guestUseCasesFactory = () => createGuestUseCases({ authUseCases })
  const guestUseCases = createMemo(guestUseCasesFactory)

  function container() {
    return {
      userUseCases,
      guestUseCases,
      authUseCases,
    }
  }

  return container()
})

export const useCases = {
  ...container,
}
