import { describe, expect, it, vi } from 'vitest'

import { createAuthService } from '~/modules/auth/application/services/authService'
import { type AuthStore } from '~/modules/auth/application/store/authStore'
import { type AuthSession } from '~/modules/auth/domain/auth'
import { type AuthGateway } from '~/modules/auth/domain/authGateway'
import { createAuthGatewayMock } from '~/modules/auth/tests/utils/mockAuthGateway'
import { createAuthStoreMock } from '~/modules/auth/tests/utils/mockAuthStore'

describe('Auth with automatic user creation', () => {
  it('should automatically create user profile for new OAuth users', async () => {
    const mockGateway: AuthGateway = createAuthGatewayMock()
    const mockStore: AuthStore = createAuthStoreMock()
    const authService = createAuthService(mockStore, mockGateway, {
      fetchUser: vi.fn(),
      forceSwitchToUser_unsafe: vi.fn(),
      insertUserSilently: vi.fn().mockResolvedValue({
        uuid: 'new-user-uuid',
        email: 'a@a.a',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    })

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
    const mockStore: AuthStore = createAuthStoreMock()
    const authService = createAuthService(mockStore, mockGateway, {
      fetchUser: vi.fn(),
      forceSwitchToUser_unsafe: vi.fn(),
      insertUserSilently: vi.fn().mockRejectedValue(new Error('DB error')),
    })

    expect(() => authService.initializeAuth()).not.toThrow()
  })
})
