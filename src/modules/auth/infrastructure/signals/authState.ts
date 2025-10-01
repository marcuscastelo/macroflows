import { createSignal } from 'solid-js'

import { type AuthState } from '~/modules/auth/domain/auth'

// Auth state signals
export const [authState, setAuthState] = createSignal<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
})
