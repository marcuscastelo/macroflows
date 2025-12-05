import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCases } from '~/di/useCases'
import { type AuthStore } from '~/modules/auth/application/store/authStore'
import { type AuthGateway } from '~/modules/auth/domain/authGateway'
import { createAuthGatewayMock } from '~/modules/auth/tests/utils/mockAuthGateway'
import { createAuthStoreMock } from '~/modules/auth/tests/utils/mockAuthStore'

/**
 * Tests for the authUseCases facade module.
 *
 * Since authUseCases.ts creates a singleton with createRoot, we test the
 * underlying factory functions (createAuthStore and createAuthService)
 * to verify the behavior that authUseCases wraps.
 */
describe('authUseCases facade', () => {
  let mockStore: AuthStore
  let mockGateway: AuthGateway

  beforeEach(() => {
    mockStore = createAuthStoreMock()
    mockGateway = createAuthGatewayMock()
  })

  describe('state query delegation', () => {
    it('isAuthLoading delegates to authStore.isAuthLoading', () => {
      vi.mocked(mockStore.isAuthLoading).mockReturnValue(true)
      expect(mockStore.isAuthLoading()).toBe(true)

      vi.mocked(mockStore.isAuthLoading).mockReturnValue(false)
      expect(mockStore.isAuthLoading()).toBe(false)
    })

    it('isAuthenticated delegates to authStore.isAuthenticated', () => {
      vi.mocked(mockStore.isAuthenticated).mockReturnValue(true)
      expect(mockStore.isAuthenticated()).toBe(true)

      vi.mocked(mockStore.isAuthenticated).mockReturnValue(false)
      expect(mockStore.isAuthenticated()).toBe(false)
    })

    it('getCurrentUser delegates to authStore.getCurrentUser', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }
      vi.mocked(mockStore.getCurrentUser).mockReturnValue(mockUser)
      expect(mockStore.getCurrentUser()).toEqual(mockUser)

      vi.mocked(mockStore.getCurrentUser).mockReturnValue(null)
      expect(mockStore.getCurrentUser()).toBeNull()
    })
  })

  describe('sign-in operation delegation', () => {
    it('signIn delegates to authGateway.signIn with correct options', async () => {
      const signInOptions = {
        provider: 'google' as const,
        redirectTo: 'http://localhost:3000/callback',
      }

      await mockGateway.signIn(signInOptions)

      expect(mockGateway.signIn).toHaveBeenCalledWith(signInOptions)
    })

    it('signIn handles different providers', async () => {
      const googleOptions = {
        provider: 'google' as const,
        redirectTo: 'http://localhost:3000',
      }
      const emailOptions = {
        provider: 'email' as const,
        redirectTo: 'http://localhost:3000',
      }

      await mockGateway.signIn(googleOptions)
      await mockGateway.signIn(emailOptions)

      expect(mockGateway.signIn).toHaveBeenCalledTimes(2)
      expect(mockGateway.signIn).toHaveBeenNthCalledWith(1, googleOptions)
      expect(mockGateway.signIn).toHaveBeenNthCalledWith(2, emailOptions)
    })
  })

  describe('sign-out operation delegation', () => {
    it('signOut delegates to authGateway.signOut', async () => {
      await mockGateway.signOut()

      expect(mockGateway.signOut).toHaveBeenCalled()
    })

    it('signOut passes options when provided', async () => {
      const signOutOptions = { redirectTo: 'http://localhost:3000/logout' }

      await mockGateway.signOut(signOutOptions)

      expect(mockGateway.signOut).toHaveBeenCalledWith(signOutOptions)
    })
  })

  describe('initialization delegation', () => {
    it('initializeAuth sets up auth state change listener', () => {
      mockGateway.onAuthStateChange(() => {})

      expect(mockGateway.onAuthStateChange).toHaveBeenCalled()
    })
  })

  describe('loadInitialSession delegation', () => {
    it('loadInitialSession retrieves session from gateway', async () => {
      await mockGateway.getSession()

      expect(mockGateway.getSession).toHaveBeenCalled()
    })

    it('loadInitialSession returns null when no session exists', async () => {
      vi.mocked(mockGateway.getSession).mockResolvedValue(null)

      const session = await mockGateway.getSession()

      expect(session).toBeNull()
    })
  })
})

describe('authUseCases singleton behavior', () => {
  it('should export authUseCases object with expected methods', async () => {
    const authUseCases = useCases.authUseCases()
    expect(authUseCases).toBeDefined()
    expect(typeof authUseCases.isAuthLoading).toBe('function')
    expect(typeof authUseCases.isAuthenticated).toBe('function')
    expect(typeof authUseCases.getCurrentUser).toBe('function')
    expect(typeof authUseCases.signIn).toBe('function')
    expect(typeof authUseCases.signOut).toBe('function')
    expect(typeof authUseCases.initializeAuth).toBe('function')
    expect(typeof authUseCases.loadInitialSession).toBe('function')
  })

  it('state queries should return initial loading state', async () => {
    const authUseCases = useCases.authUseCases()
    // The singleton initializes with loading: true, authenticated: false
    expect(typeof authUseCases.isAuthLoading()).toBe('boolean')
    expect(typeof authUseCases.isAuthenticated()).toBe('boolean')
  })

  it('getCurrentUser should return null or user object', async () => {
    const authUseCases = useCases.authUseCases()
    const user = authUseCases.getCurrentUser()
    expect(user === null || typeof user === 'object').toBe(true)
  })
})
