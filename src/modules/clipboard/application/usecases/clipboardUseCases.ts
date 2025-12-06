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

/**
 * Factory that creates clipboard use-cases.
 *
 * Allows injecting a pre-created store and toast helpers for DI and testing.
 * Defaults keep the original behaviour (in-memory store + toast functions).
 */
export function createClipboardUseCases(deps?: {
  clipboardStore?: ReturnType<typeof createClipboardStore>
  createClipboardStore?: typeof createClipboardStore
  createNoOpPersistence?: typeof createNoOpPersistence
  showSuccess?: typeof showSuccess
  showError?: typeof showError
}) {
  const localCreateClipboardStore =
    deps?.createClipboardStore ?? createClipboardStore
  const localCreateNoOpPersistence =
    deps?.createNoOpPersistence ?? createNoOpPersistence
  const _showSuccess = deps?.showSuccess ?? showSuccess
  const _showError = deps?.showError ?? showError

  const clipboardStore =
    deps?.clipboardStore ??
    createRoot(() => {
      // Default to RAM-only (no persistence)
      const store = localCreateClipboardStore({
        maxEntries: 20,
        persistence: localCreateNoOpPersistence(),
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

  return {
    copy(payload: ClipboardPayload): void {
      clipboardStore.copy(payload)
      _showSuccess('Conteúdo copiado para a área de transferência.')
    },

    confirmPaste<T extends ClipboardPayload>(
      acceptedClipboardSchema: z.ZodType<T>,
      onPasteConfirmed: (data: T) => void,
    ) {
      const parsed = this.fetchLatestParsing(acceptedClipboardSchema)
      if (parsed === null) {
        _showError(
          'A área de transferência está vazia ou o conteúdo é inválido.',
        )
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
        _showError('O conteúdo da área de transferência não é compatível.')
        return null
      }

      return safeParseResult.data satisfies T
    },

    clear(): void {
      clipboardStore.clear()
    },
  }
}

/**
 * Backward-compatible shim: keep the original named export while allowing DI consumers
 * to call `createClipboardUseCases` directly when they need to inject dependencies.
 */
export const clipboardUseCases = createClipboardUseCases()

// Export the factory type for DI/testing consumers (do not re-export the function which
// is already exported above to avoid duplicate export errors)
export type ClipboardUseCases = ReturnType<typeof createClipboardUseCases>
