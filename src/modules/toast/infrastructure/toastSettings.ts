/**
 * Toast Settings
 *
 * User-configurable settings for the toast notification system.
 * Settings are persisted in local storage.
 */

import { createEffect, createSignal } from 'solid-js'

import { isDevelopment } from '~/shared/config/env'
import { logToBreadcrumb } from '~/shared/config/sentry'
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
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null && stored.length > 0) {
      const parsed = jsonParseWithStack(stored)
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
      return { ...DEFAULT_SETTINGS }
    }
  } catch (error) {
    if (isDevelopment()) {
      logToBreadcrumb('Failed to load toast settings', 'error', { error })
    }
  }
  return { ...DEFAULT_SETTINGS }
}

// Create reactive signal for settings
const [settings, setSettings] = createSignal<ToastSettings>(loadSettings())

// Persist settings to local storage when they change
createEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings()))
  } catch (error) {
    if (isDevelopment()) {
      logToBreadcrumb('Failed to save toast settings', 'error', { error })
    }
  }
})

/**
 * Gets the current toast settings.
 * @returns The current ToastSettings object.
 */
export function getToastSettings(): ToastSettings {
  return settings()
}

/**
 * Updates toast settings.
 * @param updates Partial settings to update.
 */
export function updateToastSettings(updates: Partial<ToastSettings>): void {
  setSettings((current) => ({ ...current, ...updates }))
}

/**
 * Resets toast settings to defaults.
 */
export function resetToastSettings(): void {
  setSettings({ ...DEFAULT_SETTINGS })
}

/**
 * Helper functions for specific settings
 */

export function setShowBackgroundSuccess(value: boolean): void {
  updateToastSettings({ showBackgroundSuccess: value })
}

export function setShowBackgroundLoading(value: boolean): void {
  updateToastSettings({ showBackgroundLoading: value })
}

export function setAutoDismissErrors(value: boolean): void {
  updateToastSettings({ autoDismissErrors: value })
}

export function setDefaultDuration(value: number): void {
  updateToastSettings({ defaultDuration: value })
}

export function setGroupSimilarToasts(value: boolean): void {
  updateToastSettings({ groupSimilarToasts: value })
}

export function setShowDetailedErrors(value: boolean): void {
  updateToastSettings({ showDetailedErrors: value })
}

// Add JSDoc for all exported types and functions for better maintainability
