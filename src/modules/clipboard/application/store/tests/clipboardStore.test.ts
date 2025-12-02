import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import {
  type ClipboardEntry,
  type ClipboardPayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { type ClipboardPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { createItem } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import {
  createNewRecipe,
  promoteRecipe,
} from '~/modules/diet/recipe/domain/recipe'

describe('ClipboardStore', () => {
  const mockPersistence: ClipboardPersistence = {
    save: vi.fn(),
    load: vi.fn((): ClipboardEntry[] => []),
    cleanExpired: vi.fn(
      (entries: ClipboardEntry[]): ClipboardEntry[] => entries,
    ),
    clear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('copy', () => {
    it('adds entry to the store', () => {
      const store = createClipboardStore()
      const payload: ClipboardPayload = createItem({
        id: 1,
        name: 'Test Item',
        quantity: 100,
        reference: {
          type: 'food',
          id: 1,
          macros: createMacroNutrients({
            proteinInGrams: 10,
            carbsInGrams: 20,
            fatInGrams: 5,
          }),
        },
      })

      store.copy(payload)

      const entries = store.readAll()
      expect(entries).toHaveLength(1)
      expect(entries[0]!.payload).toEqual(payload)
    })

    it('adds entry at the beginning', () => {
      const store = createClipboardStore()
      const payload1: ClipboardPayload = promoteMeal(
        createNewMeal({ name: 'Meal 1', items: [] }),
        {
          id: 1,
        },
      )
      const payload2: ClipboardPayload = promoteMeal(
        createNewMeal({ name: 'Meal 2', items: [] }),
        {
          id: 1,
        },
      )

      store.copy(payload1)
      store.copy(payload2)

      const entries = store.readAll()
      expect(entries[0]!.payload).toEqual(payload2)
      expect(entries[1]!.payload).toEqual(payload1)
    })

    it('respects maxEntries limit', () => {
      const store = createClipboardStore({ maxEntries: 3 })

      for (let i = 0; i < 5; i++) {
        store.copy(
          promoteMeal(createNewMeal({ name: `Meal ${i}`, items: [] }), {
            id: 1,
          }),
        )
      }

      const entries = store.readAll()
      expect(entries.length).toBeLessThanOrEqual(3)
    })

    it('preserves pinned entries when exceeding maxEntries', () => {
      const store = createClipboardStore({ maxEntries: 3 })

      store.copy(
        promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      )
      const entries = store.readAll()
      store.togglePin(entries[0]!.id)

      // Add more entries
      for (let i = 2; i <= 5; i++) {
        store.copy(
          promoteMeal(createNewMeal({ name: `Meal ${i}`, items: [] }), {
            id: 1,
          }),
        )
      }

      const finalEntries = store.readAll()
      expect(finalEntries.some((e) => e.pinned)).toBe(true)
    })

    it('calls persistence save', () => {
      const store = createClipboardStore({ persistence: mockPersistence })
      const payload: ClipboardPayload = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          user_id: 'user1',
          items: [],
          prepared_multiplier: 1,
        }),
        { id: 1 },
      )
      store.copy(payload)

      expect(mockPersistence.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('read', () => {
    it('returns most recent entry', () => {
      const store = createClipboardStore()
      const payload1: ClipboardPayload = {
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      }
      const payload2: ClipboardPayload = {
        ...promoteMeal(createNewMeal({ name: 'Meal 2', items: [] }), {
          id: 1,
        }),
      }

      store.copy(payload1)
      store.copy(payload2)

      const latest = store.read()
      expect(latest?.payload).toEqual(payload2)
    })

    it('returns null when empty', () => {
      const store = createClipboardStore()
      expect(store.read()).toBeNull()
    })
  })

  describe('readAll', () => {
    it('returns all entries', () => {
      const store = createClipboardStore()

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })
      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 2', items: [] }), {
          id: 1,
        }),
      })

      expect(store.readAll()).toHaveLength(2)
    })

    it('returns empty array when no entries', () => {
      const store = createClipboardStore()
      expect(store.readAll()).toEqual([])
    })
  })

  describe('clear', () => {
    it('removes all unpinned entries', () => {
      const store = createClipboardStore()

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })
      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 2', items: [] }), {
          id: 1,
        }),
      })

      store.clear()

      expect(store.readAll()).toEqual([])
    })

    it('preserves pinned entries', () => {
      const store = createClipboardStore()

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })
      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 2', items: [] }), {
          id: 1,
        }),
      })

      const entries = store.readAll()
      store.togglePin(entries[0]!.id)

      store.clear()

      const remaining = store.readAll()
      expect(remaining).toHaveLength(1)
      expect(remaining[0]!.pinned).toBe(true)
    })

    it('calls persistence save', () => {
      const store = createClipboardStore({ persistence: mockPersistence })
      store.clear()
      expect(mockPersistence.save).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('removes specific entry by id', () => {
      const store = createClipboardStore()

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })
      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 2', items: [] }), {
          id: 1,
        }),
      })
      const entries = store.readAll()
      store.remove(entries[0]!.id)

      expect(store.readAll()).toHaveLength(1)
    })
  })

  describe('togglePin', () => {
    it('toggles pinned status', () => {
      const store = createClipboardStore()

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })

      const entries = store.readAll()
      const entryId = entries[0]!.id

      expect(entries[0]!.pinned).toBe(false)

      store.togglePin(entryId)
      expect(store.readAll()[0]!.pinned).toBe(true)

      store.togglePin(entryId)
      expect(store.readAll()[0]!.pinned).toBe(false)
    })
  })

  describe('cleanExpired', () => {
    it('calls persistence cleanExpired', () => {
      const store = createClipboardStore({ persistence: mockPersistence })

      store.copy({
        ...promoteMeal(createNewMeal({ name: 'Meal 1', items: [] }), {
          id: 1,
        }),
      })

      store.cleanExpired()

      expect(mockPersistence.cleanExpired).toHaveBeenCalled()
    })

    it('updates entries if cleaned', () => {
      const mockEntry: ClipboardEntry = {
        id: '1',
        payload: {
          ...promoteMeal(createNewMeal({ name: 'Old Meal', items: [] }), {
            id: 1,
          }),
        },
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        pinned: false,
      }

      const customPersistence: ClipboardPersistence = {
        save: vi.fn(),
        load: vi.fn((): ClipboardEntry[] => [mockEntry]),
        cleanExpired: vi.fn((): ClipboardEntry[] => []), // Simulate all expired
        clear: vi.fn(),
      }

      const store = createClipboardStore({ persistence: customPersistence })
      expect(store.readAll()).toHaveLength(1)

      store.cleanExpired()

      expect(store.readAll()).toHaveLength(0)
    })
  })

  describe('persistence integration', () => {
    it('loads initial entries from persistence', () => {
      const mockEntry: ClipboardEntry = {
        id: '1',
        payload: {
          ...promoteMeal(createNewMeal({ name: 'Persisted Meal', items: [] }), {
            id: 1,
          }),
        },
        createdAt: Date.now(),
        pinned: false,
      }

      const loadPersistence: ClipboardPersistence = {
        save: vi.fn(),
        load: vi.fn((): ClipboardEntry[] => [mockEntry]),
        cleanExpired: vi.fn(
          (entries: ClipboardEntry[]): ClipboardEntry[] => entries,
        ),
        clear: vi.fn(),
      }

      const store = createClipboardStore({ persistence: loadPersistence })

      expect(store.readAll()).toHaveLength(1)
      expect(store.readAll()[0]!.payload.__type).toBe('Meal')
    })
  })
})
