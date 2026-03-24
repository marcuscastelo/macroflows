/**
 * Toast Settings
 *
 * User-configurable settings for the toast notification system.
 * Settings are persisted in local storage.
 */

import { createEffect, createRoot, createSignal } from 'solid-js'

import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'

/**
 * User-configurable toast settings.
 * @property showBackgroundSuccess Whether to show success toasts for background operations
 * @property showBackgroundLoading Whether to show loading toasts for background operations
 * @property autoDismissErrors Whether to automatically dismiss error toasts
 * @property defaultDuration Default duration for toasts in milliseconds
 * @property groupSimilarToasts Whether to group similar toasts together
 * @property showDetailedErrors Whether to show detailed error information in toasts
 */
export type ToastSettings = {
  /** Show success toasts for background operations */
  showBackgroundSuccess: boolean
  /** Show loading toasts for background operations */
  showBackgroundLoading: boolean
  /** Automatically dismiss error toasts */
  autoDismissErrors: boolean
  /** Default duration for toasts in milliseconds */
  defaultDuration: number
  /** Group similar toasts together */
  groupSimilarToasts: boolean
  /** Show detailed error information in toasts */
  showDetailedErrors: boolean
}

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

/**
 * Load settings from local storage
 */
function loadSettings(): ToastSettings {
  const stored = localStorage.getItem(STORAGE_KEY)
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

/**
 * Factory that creates a toast settings store backed by localStorage.
 *
 * @returns A store with read, update, and reset operations for toast settings.
 */
export function createToastSettingsStore() {
  return createRoot(() => {
    const [settings, setSettings] = createSignal<ToastSettings>(loadSettings())

    createEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings()))
    })

    function getToastSettings(): ToastSettings {
      return settings()
    }

    function updateToastSettings(updates: Partial<ToastSettings>): void {
      setSettings((current) => ({ ...current, ...updates }))
    }

    function resetToastSettings(): void {
      setSettings({ ...DEFAULT_SETTINGS })
    }

    return {
      getToastSettings,
      updateToastSettings,
      resetToastSettings,
    }
  })
}
