import { createSignal } from 'solid-js'

import {
  type ClipboardEntry,
  type ClipboardPayload,
  createClipboardEntry,
} from '~/modules/clipboard/domain/clipboardEntry'
import { type ClipboardPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'

export type ClipboardStoreConfig = {
  maxEntries?: number
  persistence?: ClipboardPersistence
}

export function createClipboardStore(config?: ClipboardStoreConfig) {
  const maxEntries = config?.maxEntries ?? 20
  const persistence = config?.persistence

  // Load initial entries from persistence if available
  const initialEntries = persistence?.load() ?? []
  const [entries, setEntries] = createSignal<ClipboardEntry[]>(initialEntries)

  const persist = () => {
    if (persistence !== undefined) {
      persistence.save(entries())
    }
  }

  return {
    /**
     * Copy a payload to the clipboard
     */
    copy(payload: ClipboardPayload): void {
      const entry = createClipboardEntry(payload)

      setEntries((prev) => {
        // Remove unpinned entries if we exceed max
        let newEntries = [entry, ...prev]
        if (newEntries.length > maxEntries) {
          newEntries = [
            entry,
            ...prev.filter((e) => e.pinned).slice(0, maxEntries - 1),
          ]
        }
        return newEntries
      })

      persist()
    },

    /**
     * Read the most recent entry
     */
    read(): ClipboardEntry | null {
      const allEntries = entries()
      return allEntries.length > 0 ? (allEntries[0] ?? null) : null
    },

    /**
     * Read all entries
     */
    readAll(): ClipboardEntry[] {
      return entries()
    },

    /**
     * Clear all unpinned entries
     */
    clear(): void {
      setEntries((prev) => prev.filter((e) => e.pinned))
      persist()
    },

    /**
     * Remove a specific entry by id
     */
    remove(id: string): void {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      persist()
    },

    /**
     * Toggle pin status of an entry
     */
    togglePin(id: string): void {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
      )
      persist()
    },

    /**
     * Clean expired entries (if persistence is enabled)
     */
    cleanExpired(): void {
      if (persistence !== undefined) {
        const cleaned = persistence.cleanExpired(entries())
        if (cleaned.length !== entries().length) {
          setEntries(cleaned)
          persist()
        }
      }
    },
    // Expose entries accessor for Solid reactivity
    entries,
  }
}

export type ClipboardStore = ReturnType<typeof createClipboardStore>
