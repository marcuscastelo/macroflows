import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  disableGuestMode,
  enableGuestMode,
  isGuestMode,
  isInGuestMode,
} from '~/shared/guest/guestState'

describe('GuestState', () => {
  beforeEach(() => {
    disableGuestMode() // Reset to disabled state
  })

  afterEach(() => {
    disableGuestMode()
  })

  describe('initial state', () => {
    it('should start with guest mode disabled', () => {
      expect(isInGuestMode()).toBe(false)
      expect(isGuestMode()).toBe(false)
    })
  })

  describe('enableGuestMode', () => {
    it('should enable guest mode', () => {
      enableGuestMode()

      expect(isInGuestMode()).toBe(true)
      expect(isGuestMode()).toBe(true)
    })
  })

  describe('disableGuestMode', () => {
    it('should disable guest mode', () => {
      enableGuestMode()
      expect(isInGuestMode()).toBe(true)

      disableGuestMode()
      expect(isInGuestMode()).toBe(false)
    })
  })

  describe('isGuestMode signal', () => {
    it('should be a reactive signal', () => {
      const values: boolean[] = []

      // Record initial value
      values.push(isGuestMode())

      // Enable and record
      enableGuestMode()
      values.push(isGuestMode())

      // Disable and record
      disableGuestMode()
      values.push(isGuestMode())

      expect(values).toEqual([false, true, false])
    })
  })

  describe('toggle behavior', () => {
    it('should toggle between enabled and disabled', () => {
      expect(isInGuestMode()).toBe(false)

      enableGuestMode()
      expect(isInGuestMode()).toBe(true)

      disableGuestMode()
      expect(isInGuestMode()).toBe(false)

      enableGuestMode()
      expect(isInGuestMode()).toBe(true)
    })

    it('should handle multiple enable calls', () => {
      enableGuestMode()
      enableGuestMode()
      enableGuestMode()

      expect(isInGuestMode()).toBe(true)
    })

    it('should handle multiple disable calls', () => {
      disableGuestMode()
      disableGuestMode()
      disableGuestMode()

      expect(isInGuestMode()).toBe(false)
    })
  })
})
