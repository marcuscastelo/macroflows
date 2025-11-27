import { createRoot } from 'solid-js'
import { type z } from 'zod/v4'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import {
  type ClipboardEntry,
  type ClipboardPayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { openPasteConfirmModal } from '~/modules/clipboard/ui/PasteConfirmModal'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

const clipboardStore = createRoot(() => {
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

export const clipboardUseCases = {
  copy(payload: ClipboardPayload): void {
    clipboardStore.copy(payload)
    showSuccess('Conteúdo copiado para a área de transferência.')
  },

  confirmPaste<T extends ClipboardPayload>(
    acceptedClipboardSchema: z.ZodType<T>,
    onPasteConfirmed: (data: T) => void,
  ) {
    const parsed = clipboardUseCases.fetchLatestParsing(acceptedClipboardSchema)
    if (parsed === null) {
      showError('A área de transferência está vazia ou o conteúdo é inválido.')
      return
    }

    openPasteConfirmModal(parsed, onPasteConfirmed)
  },

  remove(id: string): void {
    clipboardStore.remove(id)
  },

  togglePin(id: string): void {
    clipboardStore.togglePin(id)
  },

  entries(): ClipboardEntry[] {
    return clipboardStore.entries()
  },

  entryCount(): number {
    return clipboardStore.entries().length
  },

  fetchLatest(): ClipboardEntry | null {
    return clipboardStore.read()
  },

  fetchLatestParsing<T extends ClipboardPayload>(
    acceptedClipboardSchema: z.ZodType<T>,
  ): T | null {
    const data = clipboardStore.read()
    if (data === null) {
      logging.debug('No clipboard data present')
      return null
    }

    const safeParseResult = acceptedClipboardSchema.safeParse(data.payload)
    if (!safeParseResult.success) {
      logging.warn('Clipboard data did not match accepted schema', {
        errors: safeParseResult.error,
      })
      showError('O conteúdo da área de transferência não é compatível.')
      return null
    }

    return safeParseResult.data satisfies T
  },

  clear(): void {
    clipboardStore.clear()
  },
}
