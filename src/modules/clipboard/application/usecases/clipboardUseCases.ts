import { type z } from 'zod/v4'

import { clipboardStore } from '~/modules/clipboard/application/hooks/useClipboardUnified'
import {
  type ClipboardEntry,
  type ClipboardPayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

export const clipboardUseCases = {
  save(payload: ClipboardPayload): void {
    clipboardStore.copy(payload)
    showSuccess('Conteúdo copiado para a área de transferência.')
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
