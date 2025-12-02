import { createSignal } from 'solid-js'

import { type AuthState } from '~/modules/auth/domain/auth'

export function createAuthStore() {
  // Auth state signals
  const [authState, setAuthState] = createSignal<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
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
