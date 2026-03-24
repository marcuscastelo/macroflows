import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { availableTabs } from '~/sections/search/components/TemplateSearchTabs'

let localStorageMock: Record<string, string> = {}

const STORAGE_KEY = 'macroflows:template-search-tab'

function setMockLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock[key]
    }),
  })
}

describe('templateSearchTabPreference', () => {
  beforeEach(() => {
    localStorageMock = {}
    setMockLocalStorage()
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('loadTabPreference', () => {
    it('returns default tab when localStorage is empty', async () => {
      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      expect(tabPreference.loadTabPreference()).toBe(availableTabs.Todos.id)
    })

    it('returns persisted tab from localStorage', async () => {
      localStorageMock[STORAGE_KEY] = availableTabs.Favoritos.id
      setMockLocalStorage()
      vi.resetModules()

      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      expect(tabPreference.loadTabPreference()).toBe(availableTabs.Favoritos.id)
    })

    it('returns persisted Recentes tab from localStorage', async () => {
      localStorageMock[STORAGE_KEY] = availableTabs.Recentes.id
      setMockLocalStorage()
      vi.resetModules()

      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      expect(tabPreference.loadTabPreference()).toBe(availableTabs.Recentes.id)
    })

    it('returns persisted Receitas tab from localStorage', async () => {
      localStorageMock[STORAGE_KEY] = availableTabs.Receitas.id
      setMockLocalStorage()
      vi.resetModules()

      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      expect(tabPreference.loadTabPreference()).toBe(availableTabs.Receitas.id)
    })

    it('returns default tab for invalid stored value', async () => {
      localStorageMock[STORAGE_KEY] = 'invalid-tab-id'
      setMockLocalStorage()
      vi.resetModules()

      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      expect(tabPreference.loadTabPreference()).toBe(availableTabs.Todos.id)
    })
  })

  describe('saveTabPreference', () => {
    it('saves tab preference to localStorage', async () => {
      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      tabPreference.saveTabPreference(availableTabs.Favoritos.id)

      expect(localStorageMock[STORAGE_KEY]).toBe(availableTabs.Favoritos.id)
    })

    it('does not persist hidden tab state', async () => {
      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      tabPreference.saveTabPreference('hidden')

      expect(localStorageMock[STORAGE_KEY]).toBeUndefined()
    })

    it('overwrites previous preference', async () => {
      localStorageMock[STORAGE_KEY] = availableTabs.Favoritos.id
      setMockLocalStorage()
      vi.resetModules()

      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      tabPreference.saveTabPreference(availableTabs.Recentes.id)

      expect(localStorageMock[STORAGE_KEY]).toBe(availableTabs.Recentes.id)
    })
  })

  describe('round-trip persistence', () => {
    it('can save and load tab preference', async () => {
      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const tabPreference = createTemplateSearchTabPreference()

      // Save a preference
      tabPreference.saveTabPreference(availableTabs.Receitas.id)

      // Re-import to get fresh module state
      vi.resetModules()
      const freshModule =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')
      const freshTabPreference = freshModule.createTemplateSearchTabPreference()

      // Load should return the saved preference
      expect(freshTabPreference.loadTabPreference()).toBe(
        availableTabs.Receitas.id,
      )
    })
  })

  describe('createTemplateSearchTabPreference', () => {
    it('returns load and save methods', async () => {
      const { createTemplateSearchTabPreference } =
        await import('~/modules/template-search/infrastructure/templateSearchTabPreference')

      const tabPreference = createTemplateSearchTabPreference()

      expect(typeof tabPreference.loadTabPreference).toBe('function')
      expect(typeof tabPreference.saveTabPreference).toBe('function')
    })
  })
})
