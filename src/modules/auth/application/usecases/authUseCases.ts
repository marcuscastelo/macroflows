import { type AuthDI, createAuthDI } from '~/modules/auth/application/authDI'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'

/**
 * Factory that creates auth use-cases.
 * @param di.userUseCases - provider for user-related use-cases (injected)
 */
export function createAuthUseCases(di: AuthDI) {
  const { authStore, authService } = createAuthDI(di)

  return {
    currentUserIdOrGuestId: () =>
      authStore.getCurrentUser()?.id ?? GUEST_USER_ID,
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
}

/**
 * Public type for the concrete auth use-cases returned by the factory.
 */
export type AuthUseCases = ReturnType<typeof createAuthUseCases>
