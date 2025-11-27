import { clipboardStore } from '~/modules/clipboard/application/hooks/useClipboardUnified'
import {
  type ClipboardEntry,
  type ClipboardPayload,
} from '~/modules/clipboard/domain/clipboardEntry'

export const clipboardUseCases = {
  save(payload: ClipboardPayload): void {
    clipboardStore.copy(payload)
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
