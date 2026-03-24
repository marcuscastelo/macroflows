import {
  createToastSettingsStore,
  type ToastSettings,
} from '~/modules/toast/infrastructure/toastSettings'

const toastSettingsStore = createToastSettingsStore()

/**
 * Gets the current toast settings from the default runtime store.
 *
 * @returns The current toast settings.
 */
export function getToastSettings(): ToastSettings {
  return toastSettingsStore.getToastSettings()
}

/**
 * Updates the current toast settings in the default runtime store.
 *
 * @param updates Partial toast settings to apply.
 * @returns void.
 */
export function updateToastSettings(updates: Partial<ToastSettings>): void {
  toastSettingsStore.updateToastSettings(updates)
}

/**
 * Resets the current toast settings in the default runtime store.
 *
 * @returns void.
 */
export function resetToastSettings(): void {
  toastSettingsStore.resetToastSettings()
}

export type { ToastSettings }
