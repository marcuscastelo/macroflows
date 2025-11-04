import {
  type ClipboardStore,
  createClipboardStore,
} from '~/modules/clipboard/application/clipboardStore'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'

let globalStore: ClipboardStore | null = null

/**
 * Get the global clipboard store instance
 * Creates it if it doesn't exist (RAM-only by default)
 */
export function getGlobalClipboardStore(): ClipboardStore {
  if (globalStore === null) {
    // Default to RAM-only (no persistence)
    globalStore = createClipboardStore({
      maxEntries: 20,
      persistence: createNoOpPersistence(),
    })

    // Clean expired entries every hour
    setInterval(
      () => {
        globalStore?.cleanExpired()
      },
      60 * 60 * 1000,
    )
  }

  return globalStore
}

/**
 * Reset the global clipboard store (useful for testing or logout)
 */
export function resetGlobalClipboardStore(): void {
  globalStore = null
}
