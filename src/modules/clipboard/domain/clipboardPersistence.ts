import { type ClipboardEntry } from '~/modules/clipboard/domain/clipboardEntry'

/**
 * Contract for clipboard persistence implementations consumed by the store.
 */
export type ClipboardPersistence = {
  save: (entries: ClipboardEntry[]) => void
  load: () => ClipboardEntry[]
  cleanExpired: (entries: ClipboardEntry[]) => ClipboardEntry[]
  clear: () => void
}
