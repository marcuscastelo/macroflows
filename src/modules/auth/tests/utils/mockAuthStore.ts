import { vi } from 'vitest'

import { type AuthStore } from '~/modules/auth/application/store/authState'

export function createAuthStoreMock(): AuthStore {
  return {
    authState: vi.fn().mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    }),
    setAuthState: vi.fn(),
    getCurrentUser: vi.fn().mockReturnValue(null),
    isAuthenticated: vi.fn().mockReturnValue(false),
    isAuthLoading: vi.fn().mockReturnValue(false),
  }
}
