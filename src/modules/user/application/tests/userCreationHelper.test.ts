import { describe, expect, it } from 'vitest'

import { type AuthSession } from '~/modules/auth/domain/auth'
import { createDefaultUserFromAuthSession } from '~/modules/user/application/userCreationHelper'

describe('userCreationHelper', () => {
  describe('createDefaultUserFromAuthSession', () => {
    it('should create a user with full_name from metadata', () => {
      const session: AuthSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123456789,
        token_type: 'bearer',
        user: {
          id: 'test-uuid',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {
            full_name: 'John Doe',
          },
        },
      }

      const newUser = createDefaultUserFromAuthSession(session)

      expect(newUser.uuid).toBe('test-uuid')
      expect(newUser.name).toBe('John Doe')
      expect(newUser.favorite_foods).toEqual([])
      expect(newUser.diet).toBe('normo')
      expect(newUser.gender).toBe('male')
      expect(newUser.desired_weight).toBe(70)
    })

    it('should create a user with name from metadata when full_name is not available', () => {
      const session: AuthSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123456789,
        token_type: 'bearer',
        user: {
          id: 'test-uuid',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {
            name: 'Jane Smith',
          },
        },
      }

      const newUser = createDefaultUserFromAuthSession(session)

      expect(newUser.name).toBe('Jane Smith')
    })

    it('should create a user with email prefix when no name metadata is available', () => {
      const session: AuthSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123456789,
        token_type: 'bearer',
        user: {
          id: 'test-uuid',
          email: 'myemail@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {},
        },
      }

      const newUser = createDefaultUserFromAuthSession(session)

      expect(newUser.name).toBe('myemail')
    })

    it('should use "User" as fallback when email has no prefix', () => {
      const session: AuthSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123456789,
        token_type: 'bearer',
        user: {
          id: 'test-uuid',
          email: '@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      }

      const newUser = createDefaultUserFromAuthSession(session)

      expect(newUser.name).toBe('User')
    })

    it('should create a valid birthdate string', () => {
      const session: AuthSession = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123456789,
        token_type: 'bearer',
        user: {
          id: 'test-uuid',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      }

      const newUser = createDefaultUserFromAuthSession(session)

      expect(newUser.birthdate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
