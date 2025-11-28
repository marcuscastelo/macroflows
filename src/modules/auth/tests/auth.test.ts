import { describe, expect, it } from 'vitest'

import * as authModule1 from '~/modules/auth/application/services/authService'
import * as authModule2 from '~/modules/auth/application/store/authState'
import { createAuthGatewayMock } from '~/modules/auth/tests/utils/mockAuthGateway'

const authModule = {
  ...authModule1,
  ...authModule2,
}

describe('Auth Module', () => {
  const authService = authModule1.createAuthService(createAuthGatewayMock())

  it('should initialize with loading state', () => {
    const initialState = authModule.getAuthState()
    expect(initialState.isLoading).toBe(true)
    expect(initialState.isAuthenticated).toBe(false)
    expect(initialState.user).toBeNull()
    expect(initialState.session).toBeNull()
  })

  it('should check authentication status', () => {
    expect(authModule.isAuthenticated()).toBe(false)
    expect(authModule.isAuthLoading()).toBe(true)
    expect(authModule.getCurrentUser()).toBeNull()
  })

  it('should handle sign in operation', async () => {
    await expect(
      authService.signIn({
        provider: 'google',
        redirectTo: 'localhost:3000',
      }),
    ).resolves.not.toThrow()
  })

  it('should handle sign out operation', async () => {
    await expect(authService.signOut()).resolves.not.toThrow()
  })
})
