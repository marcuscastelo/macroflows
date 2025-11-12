import { createEffect, createSignal, onCleanup } from 'solid-js'
import { type z } from 'zod/v4'

import { getGlobalClipboardStore } from '~/modules/clipboard/application/globalClipboardStore'
import {
  type ClipboardEntry,
  clipboardPayloadSchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { deserializeClipboard } from '~/shared/utils/clipboardUtils'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type ClipboardFilter = (clipboard: string) => boolean

/**
 * Unified store hook (wraps the global clipboard store)
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

/**
 * Hook for reading/writing clipboard via the in-app clipboard store
 */
export function useClipboard(props?: {
  filter?: ClipboardFilter
  periodicRead?: boolean
}) {
  const { copy, read, clear: clearStore } = useClipboardStore()
  // keep the filter accessor for API compatibility with previous implementation

  const _filter = () => props?.filter

  const handleWrite = (text: string, onError?: (error: unknown) => void) => {
    try {
      // Treat empty string as a clear request for the clipboard store
      if (text === '') {
        clearStore()
        return
      }

      // If the incoming text is JSON, parse it first so Zod receives an object
      let parsed: unknown = text
      try {
        parsed = jsonParseWithStack(text)
      } catch {
        // If it's not valid JSON, leave as-is and let Zod validation fail
      }

      console.debug('Parsed clipboard payload:', parsed)
      const payload = parseWithStack(clipboardPayloadSchema, parsed)
      copy(payload)

      if (text.length > 0) {
        showSuccess(`Copiado com sucesso`)
      }
    } catch (err) {
      showError(
        `Failed to parse or copy using clipboard store: ${JSON.stringify(err)}`,
      )
      onError?.(err)
    }
  }

  const handleRead = async () => {
    try {
      const clipboard = read()
      const clipboardText = JSON.stringify(clipboard?.payload)

      return clipboardText
    } catch (err) {
      showError(`Failed to read using clipboard store: ${JSON.stringify(err)}`)
    }

    return ''
  }

  return {
    write: handleWrite,
    read: handleRead,
    clear: () => {
      handleWrite('')
    },
  }
}

export function createClipboardSchemaFilter(
  acceptedClipboardSchema: z.ZodType,
) {
  return (clipboard: string) => {
    if (clipboard === '') return false
    let parsedClipboard: unknown
    try {
      parsedClipboard = jsonParseWithStack(clipboard)
    } catch {
      // Error parsing JSON. Probably clipboard is some random text from the user
      return false
    }

    return acceptedClipboardSchema.safeParse(parsedClipboard).success
  }
}

/**
 * Hook that provides copy / paste actions for a given schema and handlers
 */
export function useCopyPasteActions<T>({
  acceptedClipboardSchema,
  getDataToCopy,
  onPaste,
}: {
  acceptedClipboardSchema: z.ZodType<T>
  getDataToCopy: () => T
  onPaste: (data: T) => void
}) {
  const isClipboardValid = createClipboardSchemaFilter(acceptedClipboardSchema)
  const {
    read: readFromClipboard,
    write: writeToClipboard,
    clear: clearClipboard,
  } = useClipboard({
    filter: isClipboardValid,
  })

  const handleCopy = () => {
    writeToClipboard(JSON.stringify(getDataToCopy()))
  }

  const handlePaste = () => {
    const processClipboardText = async (
      clipboardText: string,
      clearWhenFromApi = true,
    ) => {
      console.debug('Processing clipboard text:', clipboardText)
      const data = deserializeClipboard(clipboardText, acceptedClipboardSchema)
      if (data === null) {
        throw new Error('Invalid clipboard data: ' + clipboardText)
      }
      onPaste(data)
      if (clearWhenFromApi) clearClipboard()
    }

    openConfirmModal('Tem certeza que deseja colar os itens?', {
      title: 'Colar itens',
      confirmText: 'Colar',
      cancelText: 'Cancelar',
      onConfirm: () => readFromClipboard().then(processClipboardText),
    })
  }

  return {
    writeToClipboard,
    clearClipboard,
    handleCopy,
    handlePaste,
  }
}

export default {
  useClipboardStore,
  useClipboard,
  createClipboardSchemaFilter,
  useCopyPasteActions,
}
