import { type ClipboardEntry } from '~/modules/clipboard/domain/clipboardEntry'

export const clipboardUseCases = {
  save(clipboardEntry: ClipboardEntry): void {
    // Implement saving logic here
  },

  fetchLatest(): ClipboardEntry | null {
    // Implement fetching logic here
    return null
  },
}
