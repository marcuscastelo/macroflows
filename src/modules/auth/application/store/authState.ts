import { createEffect, createSignal } from 'solid-js'

import { type AuthState } from '~/modules/auth/domain/auth'
import { showPromise } from '~/modules/toast/application/toastManager'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'

export function createAuthStore() {
  // Auth state signals
  const [authState, setAuthState] = createSignal<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  createEffect(() => {
    const state = authState()
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

  return {
    authState,
    setAuthState,
    getCurrentUser: () => authState().user,
    isAuthenticated: () => authState().isAuthenticated,
    isAuthLoading: () => authState().isLoading,
  }
}

export type AuthStore = ReturnType<typeof createAuthStore>
