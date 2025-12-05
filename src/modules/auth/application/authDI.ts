import { createEffect, createRoot } from 'solid-js'

import { createAuthService } from '~/modules/auth/application/services/authService'
import { createAuthStore } from '~/modules/auth/application/store/authStore'
import { createSupabaseAuthGateway } from '~/modules/auth/infrastructure/supabase/supabaseAuthGateway'
import { showPromise } from '~/modules/toast/application/toastManager'
import type { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'

export type AuthDI = {
  userUseCases: () => ReturnType<typeof createUserUseCases>
}

export function createAuthDI(di: AuthDI) {
  return createRoot(() => {
    const userUseCases = di.userUseCases()
    const authStore = createAuthStore()
    const authGateway = createSupabaseAuthGateway()
    const authService = createAuthService(authStore, authGateway, {
      fetchUser: userUseCases.fetchUser,
      insertUserSilently: userUseCases.insertUserSilently,
      forceSwitchToUser_unsafe: userUseCases.forceSwitchToUser_unsafe,
    })

    createEffect(() => {
      const state = authStore.authState()
      showPromise(
        userUseCases
          .fetchUser(state.user?.id ?? '')
          .then(userUseCases.forceSwitchToUser_unsafe),
        {
          loading: 'Carregando dados do usuário...',
          error: 'Falha ao carregar dados do usuário',
        },
        { context: 'background' },
      ).catch(() => {})
    })

    return { authStore, authService }
  })
}
