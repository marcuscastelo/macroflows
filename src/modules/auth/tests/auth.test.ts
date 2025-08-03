import { describe, expect, it, vi } from 'vitest'

import * as authModule from '~/modules/auth/application/auth'

// Mock the error handler
vi.mock('~/shared/error/errorHandler', () => ({
  logError: vi.fn(),
}))

// Mock the Supabase auth repository
vi.mock(
  '~/modules/auth/infrastructure/supabase/supabaseAuthRepository',
  () => ({
    createSupabaseAuthRepository: () => ({
      getSession: vi.fn().mockResolvedValue(null),
      getUser: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockResolvedValue({ url: 'https://example.com' }),
      signOut: vi.fn().mockResolvedValue({}),
      refreshSession: vi.fn().mockResolvedValue(null),
      onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    }),
  }),
)

describe('Auth Module', () => {
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
      authModule.signIn({ provider: 'google' }),
    ).resolves.not.toThrow()
  })

  it('should handle sign out operation', async () => {
    await expect(authModule.signOut()).resolves.not.toThrow()
  })

  it('should handle session refresh', async () => {
    await expect(authModule.refreshSession()).resolves.not.toThrow()
  })

  it('should cleanup auth subscriptions', () => {
    expect(() => authModule.cleanupAuth()).not.toThrow()
  })
})
