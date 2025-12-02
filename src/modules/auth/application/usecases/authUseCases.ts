import { createEffect, createRoot } from 'solid-js'

import { createAuthService } from '~/modules/auth/application/services/authService'
import { createAuthStore } from '~/modules/auth/application/store/authStore'
import { showPromise } from '~/modules/toast/application/toastManager'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'

const { authStore, authService } = createRoot(() => {
  const authStore = createAuthStore()
  const authService = createAuthService(authStore)

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

export const authUseCases = {
  currentUserIdOrGuestId: () => authStore.getCurrentUser()?.id ?? GUEST_USER_ID,
  isAuthLoading: () => authStore.isAuthLoading(),
  isAuthenticated: () => authStore.isAuthenticated(),
  getCurrentUser: () => authStore.getCurrentUser(),
  signIn: (options: Parameters<typeof authService.signIn>[0]) =>
    authService.signIn(options),
  signOut: (options?: Parameters<typeof authService.signOut>[0]) =>
    authService.signOut(options),
  initializeAuth: () => authService.initializeAuth(),
  loadInitialSession: () => authService.loadInitialSession(),
}
