import { createRoot } from 'solid-js'
import { type z } from 'zod/v4'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { type ClipboardPayload } from '~/modules/clipboard/domain/clipboardEntry'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { openPasteConfirmModal } from '~/modules/clipboard/ui/PasteConfirmModal'
import { showError } from '~/modules/toast/application/toastManager'

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

export function useCopyPasteActions<T extends ClipboardPayload>({
  acceptedClipboardSchema,
  onPaste,
}: {
  acceptedClipboardSchema: z.ZodType<T>
  onPaste: (data: T) => void
}) {
  const paste = async () => {
    const parsed = clipboardUseCases.fetchLatestParsing(acceptedClipboardSchema)
    if (parsed === null) {
      showError('A área de transferência está vazia ou o conteúdo é inválido.')
      return
    }

    openPasteConfirmModal(parsed, onPaste)
  }

  return {
    paste,
  }
}
