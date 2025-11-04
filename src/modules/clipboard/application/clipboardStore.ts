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

export type ClipboardSubscriber = (entries: ClipboardEntry[]) => void

/**
 * In-memory clipboard store with optional persistence
 */
export function createClipboardStore(config?: ClipboardStoreConfig) {
  const maxEntries = config?.maxEntries ?? 20
  const persistence = config?.persistence

  // Load initial entries from persistence if available
  const initialEntries = persistence?.load() ?? []
  const [entries, setEntries] = createSignal<ClipboardEntry[]>(initialEntries)
  const subscribers: ClipboardSubscriber[] = []

  const notifySubscribers = () => {
    const currentEntries = entries()
    subscribers.forEach((subscriber) => {
      subscriber(currentEntries)
    })
  }

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
            ...prev
              .filter((e) => e.pinned)
              .slice(0, maxEntries - 1),
          ]
        }
        return newEntries
      })

      persist()
      notifySubscribers()
    },

    /**
     * Read the most recent entry
     */
    read(): ClipboardEntry | null {
      const allEntries = entries()
      return allEntries.length > 0 ? allEntries[0] : null
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
      notifySubscribers()
    },

    /**
     * Remove a specific entry by id
     */
    remove(id: string): void {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      persist()
      notifySubscribers()
    },

    /**
     * Toggle pin status of an entry
     */
    togglePin(id: string): void {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
      )
      persist()
      notifySubscribers()
    },

    /**
     * Subscribe to clipboard changes
     */
    subscribe(subscriber: ClipboardSubscriber): () => void {
      subscribers.push(subscriber)
      // Return unsubscribe function
      return () => {
        const index = subscribers.indexOf(subscriber)
        if (index > -1) {
          subscribers.splice(index, 1)
        }
      }
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
          notifySubscribers()
        }
      }
    },
  }
}

export type ClipboardStore = ReturnType<typeof createClipboardStore>
