import { clipboardStore } from '~/modules/clipboard/application/hooks/useClipboardUnified'
import {
  type ClipboardEntry,
  type ClipboardPayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { showSuccess } from '~/modules/toast/application/toastManager'

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

  clear(): void {
    clipboardStore.clear()
  },
}
