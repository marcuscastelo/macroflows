import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ClipboardEntry } from '~/modules/clipboard/domain/clipboardEntry'
import {
  createLocalStoragePersistence,
  createNoOpPersistence,
} from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'

describe('ClipboardPersistence', () => {
  describe('NoOpPersistence', () => {
    it('save does nothing', () => {
      const persistence = createNoOpPersistence()
      const entries: ClipboardEntry[] = [
        {
          id: '1',
          payload: {
            ...promoteMeal(createNewMeal({ name: 'Test', items: [] }), {
              id: 1,
            }),
          },
          createdAt: Date.now(),
          pinned: false,
        },
      ]

      expect(() => persistence.save(entries)).not.toThrow()
    })

    it('load returns empty array', () => {
      const persistence = createNoOpPersistence()
      expect(persistence.load()).toEqual([])
    })

    it('cleanExpired returns entries unchanged', () => {
      const persistence = createNoOpPersistence()
      const entries: ClipboardEntry[] = [
        {
          id: '1',
          payload: {
            ...promoteMeal(createNewMeal({ name: 'Test', items: [] }), {
              id: 1,
            }),
          },
          createdAt: Date.now() - 10000,
          pinned: false,
        },
      ]

      expect(persistence.cleanExpired(entries)).toEqual(entries)
    })

    it('clear does nothing', () => {
      const persistence = createNoOpPersistence()
      expect(() => persistence.clear()).not.toThrow()
    })
  })

  describe('LocalStoragePersistence', () => {
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {}
      return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key]
        }),
        clear: () => {
          store = {}
        },
      }
    })()

    beforeEach(() => {
      // @ts-expect-error - mocking localStorage
      globalThis.localStorage = mockLocalStorage
      mockLocalStorage.clear()
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('saves entries to localStorage', () => {
      const persistence = createLocalStoragePersistence()
      const entries: ClipboardEntry[] = [
        {
          id: '1',
          payload: promoteMeal(
            createNewMeal({ name: 'Test Meal', items: [] }),
            { id: 1 },
          ),
          createdAt: Date.now(),
          pinned: false,
        },
      ]

      persistence.save(entries)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'macroflows_clipboard',
        expect.any(String),
      )
    })

    it('loads entries from localStorage', () => {
      const entries: ClipboardEntry[] = [
        {
          id: '1',
          payload: promoteMeal(
            createNewMeal({ name: 'Test Meal', items: [] }),
            { id: 1 },
          ),
          createdAt: Date.now(),
          pinned: false,
        },
      ]

      const persistence = createLocalStoragePersistence()
      persistence.save(entries)

      const loaded = persistence.load()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]!.id).toBe('1')
    })

    it('returns empty array when localStorage is empty', () => {
      const persistence = createLocalStoragePersistence()
      expect(persistence.load()).toEqual([])
    })

    it('handles invalid JSON in localStorage', () => {
      mockLocalStorage.setItem('macroflows_clipboard', 'invalid json')

      const persistence = createLocalStoragePersistence()
      const loaded = persistence.load()

      expect(loaded).toEqual([])
    })

    it('handles non-array data in localStorage', () => {
      mockLocalStorage.setItem('macroflows_clipboard', '{"not": "an array"}')

      const persistence = createLocalStoragePersistence()
      const loaded = persistence.load()

      expect(loaded).toEqual([])
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'macroflows_clipboard',
      )
    })

    it('validates each entry when loading', () => {
      const validEntry: ClipboardEntry = {
        id: '1',
        payload: promoteMeal(createNewMeal({ name: 'Valid Meal', items: [] }), {
          id: 1,
        }),
        createdAt: Date.now(),
        pinned: false,
      }

      const invalidEntry = {
        id: '2',
        // Missing required fields
      }

      mockLocalStorage.setItem(
        'macroflows_clipboard',
        JSON.stringify([validEntry, invalidEntry]),
      )

      const persistence = createLocalStoragePersistence()
      const loaded = persistence.load()

      // Only valid entry should be loaded
      expect(loaded).toHaveLength(1)
      expect(loaded[0]!.id).toBe('1')
    })

    it('cleanExpired removes old entries', () => {
      const now = Date.now()
      const ttl = 7 * 24 * 60 * 60 * 1000 // 7 days

      const oldEntry: ClipboardEntry = {
        id: '1',
        payload: promoteMeal(createNewMeal({ name: 'Old Meal', items: [] }), {
          id: 1,
        }),
        createdAt: now - ttl - 1000, // Older than TTL
        pinned: false,
      }

      const recentEntry: ClipboardEntry = {
        id: '2',
        payload: promoteMeal(
          createNewMeal({ name: 'Recent Meal', items: [] }),
          { id: 2 },
        ),
        createdAt: now - 1000, // Recent
        pinned: false,
      }

      const persistence = createLocalStoragePersistence(ttl)
      const cleaned = persistence.cleanExpired([oldEntry, recentEntry])

      expect(cleaned).toHaveLength(1)
      expect(cleaned[0]!.id).toBe('2')
    })

    it('cleanExpired preserves pinned entries', () => {
      const now = Date.now()
      const ttl = 7 * 24 * 60 * 60 * 1000

      const oldPinnedEntry: ClipboardEntry = {
        id: '1',
        payload: promoteMeal(
          createNewMeal({ name: 'Old Pinned Meal', items: [] }),
          { id: 1 },
        ),
        createdAt: now - ttl - 1000, // Older than TTL
        pinned: true, // But pinned
      }

      const persistence = createLocalStoragePersistence(ttl)
      const cleaned = persistence.cleanExpired([oldPinnedEntry])

      expect(cleaned).toHaveLength(1)
      expect(cleaned[0]!.pinned).toBe(true)
    })

    it('clear removes data from localStorage', () => {
      const persistence = createLocalStoragePersistence()
      const entries: ClipboardEntry[] = [
        {
          id: '1',
          payload: {
            ...promoteMeal(createNewMeal({ name: 'Test', items: [] }), {
              id: 1,
            }),
          },
          createdAt: Date.now(),
          pinned: false,
        },
      ]

      persistence.save(entries)
      persistence.clear()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'macroflows_clipboard',
      )
    })
  })
})
