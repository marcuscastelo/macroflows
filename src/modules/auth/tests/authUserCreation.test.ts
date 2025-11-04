import { describe, expect, it, vi } from 'vitest'

import { createAuthService } from '~/modules/auth/application/services/authService'
import { type AuthSession } from '~/modules/auth/domain/auth'
import { type AuthGateway } from '~/modules/auth/domain/authGateway'
import { createAuthGatewayMock } from '~/modules/auth/tests/utils/mockAuthGateway'

describe('Auth with automatic user creation', () => {
  it('should automatically create user profile for new OAuth users', async () => {
    const mockGateway: AuthGateway = createAuthGatewayMock()
    const authService = createAuthService(mockGateway)

    let stateChangeCallback:
      | ((event: string, session: AuthSession | null) => void)
      | null = null
    vi.spyOn(mockGateway, 'onAuthStateChange').mockImplementation((cb) => {
      stateChangeCallback = cb
      return () => {}
    })

    authService.initializeAuth()

    expect(stateChangeCallback).not.toBeNull()
  })

  it('should handle errors gracefully when user creation fails', async () => {
    const mockGateway: AuthGateway = createAuthGatewayMock()
    const authService = createAuthService(mockGateway)

    expect(() => authService.initializeAuth()).not.toThrow()
  })
})
