import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/shared/config/env', () => ({
  isDevelopment: vi.fn(() => false),
}))

import { createToastSettingsStore } from '~/modules/toast/infrastructure/toastSettings'
import {
  getToastSettings,
  resetToastSettings,
  updateToastSettings,
} from '~/modules/toast/application/toastSettings'

const DEFAULTS = {
  showBackgroundSuccess: false,
  showBackgroundLoading: false,
  autoDismissErrors: false,
  defaultDuration: 5000,
  groupSimilarToasts: true,
  showDetailedErrors: true,
}

const STORAGE_KEY = 'macroflows:toast-settings'

let localStorageMock: Record<string, string> = {}

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

describe('toastSettings', () => {
  beforeEach(() => {
    localStorageMock = {}
    setMockLocalStorage()
    resetToastSettings()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('getToastSettings returns defaults on first run', () => {
    expect(getToastSettings()).toEqual(DEFAULTS)
  })

  it('updateToastSettings only updates provided properties', () => {
    updateToastSettings({ showBackgroundSuccess: true })
    expect(getToastSettings()).toEqual({
      ...DEFAULTS,
      showBackgroundSuccess: true,
    })
    updateToastSettings({ defaultDuration: 1234 })
    expect(getToastSettings().defaultDuration).toBe(1234)
    expect(getToastSettings().showBackgroundSuccess).toBe(true)
  })

  it('createToastSettingsStore returns isolated stores', () => {
    const firstStore = createToastSettingsStore()
    const secondStore = createToastSettingsStore()

    firstStore.updateToastSettings({ showBackgroundSuccess: true })

    expect(firstStore.getToastSettings().showBackgroundSuccess).toBe(true)
    expect(secondStore.getToastSettings()).toEqual(DEFAULTS)
  })

  it('resetToastSettings restores defaults', () => {
    updateToastSettings({ showBackgroundSuccess: true, defaultDuration: 1234 })
    resetToastSettings()
    expect(getToastSettings()).toEqual(DEFAULTS)
  })

  it('persists to localStorage and loads from it', async () => {
    // Simulate value already persisted in localStorage
    localStorageMock[STORAGE_KEY] = JSON.stringify({
      showBackgroundSuccess: true,
      defaultDuration: 1234,
    })
    vi.resetModules()
    setMockLocalStorage()
    const toastSettingsModule =
      await import('~/modules/toast/application/toastSettings')
    expect(toastSettingsModule.getToastSettings().showBackgroundSuccess).toBe(
      true,
    )
    expect(toastSettingsModule.getToastSettings().defaultDuration).toBe(1234)
  })

  it('invalid localStorage values are ignored and defaults used', async () => {
    localStorageMock[STORAGE_KEY] = '{ invalid json'
    vi.resetModules()
    setMockLocalStorage()
    const toastSettingsModule =
      await import('~/modules/toast/application/toastSettings')
    expect(toastSettingsModule.getToastSettings()).toEqual(DEFAULTS)
  })
})
