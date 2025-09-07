import { describe, expect, it } from 'vitest'

import { isSupabaseDuplicateEanError } from '~/shared/supabase/supabaseErrorUtils'

describe('isSupabaseDuplicateEanError', () => {
  it('returns true for 23505 foods_ean_key error with ean', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "foods_ean_key"',
    }
    expect(isSupabaseDuplicateEanError(error, '1234567890123')).toBe(true)
  })

  it('returns true for 23505 foods_ean_key error without ean', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "foods_ean_key"',
    }
    expect(isSupabaseDuplicateEanError(error)).toBe(false)
  })

  it('returns false for other error code', () => {
    const error = {
      code: '12345',
      message: 'some other error',
    }
    expect(isSupabaseDuplicateEanError(error, '1234567890123')).toBe(false)
  })

  it('returns false for missing foods_ean_key in message', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "other_key"',
    }
    expect(isSupabaseDuplicateEanError(error, '1234567890123')).toBe(false)
  })

  it('returns false for null/undefined error', () => {
    expect(isSupabaseDuplicateEanError(null, '1234567890123')).toBe(false)
    expect(isSupabaseDuplicateEanError(undefined, '1234567890123')).toBe(false)
  })
})
