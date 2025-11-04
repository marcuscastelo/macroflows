import { createEffect, createSignal, onCleanup } from 'solid-js'

import { getGlobalClipboardStore } from '~/modules/clipboard/application/globalClipboardStore'
import { type ClipboardEntry } from '~/modules/clipboard/domain/clipboardEntry'

/**
 * SolidJS hook to use the global clipboard store
 * Automatically subscribes to store changes and updates the signal
 */
export function useClipboardStore() {
  const store = getGlobalClipboardStore()
  const [entries, setEntries] = createSignal<ClipboardEntry[]>(store.readAll())

  createEffect(() => {
    const unsubscribe = store.subscribe((newEntries) => {
      setEntries(newEntries)
    })

    onCleanup(() => {
      unsubscribe()
    })
  })

  return {
    entries,
    copy: store.copy.bind(store),
    read: store.read.bind(store),
    readAll: store.readAll.bind(store),
    clear: store.clear.bind(store),
    remove: store.remove.bind(store),
    togglePin: store.togglePin.bind(store),
  }
}
