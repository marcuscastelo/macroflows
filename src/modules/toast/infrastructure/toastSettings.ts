/**
 * Toast Settings
 *
 * User-configurable settings for the toast notification system.
 * Settings are persisted in local storage.
 */

import { createRoot, createSignal } from 'solid-js'

import { type ToastSettings } from '~/modules/toast/domain/toastSettings'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'

/**
 * Default toast settings
 */
const DEFAULT_SETTINGS: ToastSettings = {
  showBackgroundSuccess: false,
  showBackgroundLoading: false,
  autoDismissErrors: false,
  defaultDuration: 5000,
  groupSimilarToasts: true,
  showDetailedErrors: true,
}

// Local storage key for persisting settings
const STORAGE_KEY = 'macroflows:toast-settings'

type ToastSettingsStoreConfig = {
  storageKey?: string
}

/**
 * Load settings from local storage
 */
function loadSettings(storageKey: string): ToastSettings {
  const stored = localStorage.getItem(storageKey)
  if (stored !== null && stored.length > 0) {
    try {
      const parsed = jsonParseWithStack(stored)
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
      return { ...DEFAULT_SETTINGS }
    } catch {
      // Invalid JSON, use defaults
      return { ...DEFAULT_SETTINGS }
    }
  }

  return { ...DEFAULT_SETTINGS }
}

function persistSettings(storageKey: string, settings: ToastSettings): void {
  localStorage.setItem(storageKey, JSON.stringify(settings))
}

/**
 * Factory that creates a toast settings store backed by localStorage.
 *
 * @param config Optional storage configuration for alternate wiring or tests.
 * @returns A store with read, update, and reset operations for toast settings.
 */
export function createToastSettingsStore(config?: ToastSettingsStoreConfig) {
  const storageKey = config?.storageKey ?? STORAGE_KEY

  return createRoot(() => {
    const initialSettings = loadSettings(storageKey)
    const [settings, setSettings] = createSignal<ToastSettings>(initialSettings)
    persistSettings(storageKey, initialSettings)

    function getToastSettings(): ToastSettings {
      return settings()
    }

    function updateToastSettings(updates: Partial<ToastSettings>): void {
      const nextSettings = { ...settings(), ...updates }
      setSettings(nextSettings)
      persistSettings(storageKey, nextSettings)
    }

    function resetToastSettings(): void {
      const nextSettings = { ...DEFAULT_SETTINGS }
      setSettings(nextSettings)
      persistSettings(storageKey, nextSettings)
    }

    return {
      getToastSettings,
      updateToastSettings,
      resetToastSettings,
    }
  })
}
