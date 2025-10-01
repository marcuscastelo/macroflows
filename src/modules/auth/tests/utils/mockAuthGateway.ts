import { vi } from 'vitest'

import { type AuthGateway } from '~/modules/auth/domain/authGateway'

export function createAuthGatewayMock(): AuthGateway {
  return {
    getSession: vi.fn().mockResolvedValue(null),
    getUser: vi.fn().mockReturnValue(null),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
  }
}
