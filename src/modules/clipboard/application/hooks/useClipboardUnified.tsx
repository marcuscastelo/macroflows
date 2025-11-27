import { createRoot } from 'solid-js'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'

export type ClipboardFilter = (clipboard: string) => boolean

export const clipboardStore = createRoot(() => {
  // Default to RAM-only (no persistence)
  const store = createClipboardStore({
    maxEntries: 20,
    persistence: createNoOpPersistence(),
  })
  // Clean expired entries every hour and refresh signal
  setInterval(
    () => {
      store.cleanExpired()
    },
    60 * 60 * 1000,
  )

  return store
})
