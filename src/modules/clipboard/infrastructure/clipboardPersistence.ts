import {
  type ClipboardEntry,
  clipboardEntrySchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import { type ClipboardPersistence } from '~/modules/clipboard/domain/clipboardPersistence'
import { logging } from '~/shared/utils/logging'

const STORAGE_KEY = 'macroflows_clipboard'

/**
 * Create a localStorage-based clipboard persistence
 * @param ttlMs Time-to-live in milliseconds for entries (default: 7 days)
 */
export function createLocalStoragePersistence(
  ttlMs: number = 7 * 24 * 60 * 60 * 1000,
): ClipboardPersistence {
  return {
    save(entries: ClipboardEntry[]): void {
      try {
        const serialized = JSON.stringify(entries)
        localStorage.setItem(STORAGE_KEY, serialized)
      } catch (error) {
        logging.error('Failed to save clipboard to localStorage', error)
      }
    },

    load(): ClipboardEntry[] {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === null) {
          return []
        }

        // eslint-disable-next-line no-restricted-syntax
        const parsed: unknown = JSON.parse(stored)
        if (!Array.isArray(parsed)) {
          logging.warn('Invalid clipboard data in localStorage, clearing')
          localStorage.removeItem(STORAGE_KEY)
          return []
        }

        // Validate each entry
        const validated: ClipboardEntry[] = []
        for (const item of parsed) {
          const result = clipboardEntrySchema.safeParse(item)
          if (result.success) {
            validated.push(result.data)
          } else {
            logging.warn('Invalid clipboard entry, skipping', {
              item,
              error: result.error,
            })
          }
        }

        return validated
      } catch (error) {
        logging.error('Failed to load clipboard from localStorage', error)
        return []
      }
    },

    cleanExpired(entries: ClipboardEntry[]): ClipboardEntry[] {
      const now = Date.now()
      return entries.filter((entry) => {
        // Pinned entries never expire
        if (entry.pinned) {
          return true
        }
        // Check if entry is expired
        return now - entry.createdAt < ttlMs
      })
    },

    clear(): void {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        logging.error('Failed to clear clipboard from localStorage', error)
      }
    },
  }
}

/**
 * Create a no-op persistence (RAM-only mode)
 */
export function createNoOpPersistence(): ClipboardPersistence {
  return {
    save: () => {},
    load: () => [],
    cleanExpired: (entries) => entries,
    clear: () => {},
  }
}
