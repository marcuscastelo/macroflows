import { createRoot } from 'solid-js'

import { createAuthService } from '~/modules/auth/application/services/authService'
import { createAuthStore } from '~/modules/auth/application/store/authState'

const { authStore, authService } = createRoot(() => {
  const authStore = createAuthStore()
  const authService = createAuthService(authStore)
  return { authStore, authService }
})

export const authUseCases = {
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
