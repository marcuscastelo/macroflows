import { createEffect, createRoot, createSignal, onCleanup } from 'solid-js'
import { type z } from 'zod/v4'

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import {
  type ClipboardEntry,
  clipboardPayloadSchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import { createNoOpPersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { type Item, itemSchema } from '~/modules/diet/item/schema/itemSchema'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { ItemListView } from '~/sections/item/components/ItemListView'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { openContentModal } from '~/shared/modal/helpers/modalHelpers'
import { closeModal } from '~/shared/modal/helpers/modalHelpers'
import { deserializeClipboard } from '~/shared/utils/clipboardUtils'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type ClipboardFilter = (clipboard: string) => boolean

const clipboardStore = createRoot(() => {
  // Default to RAM-only (no persistence)
  const globalStore = createClipboardStore({
    maxEntries: 20,
    persistence: createNoOpPersistence(),
  })

  // Clean expired entries every hour
  setInterval(
    () => {
      globalStore.cleanExpired()
    },
    60 * 60 * 1000,
  )

  return globalStore
})

/**
 * Unified store hook (wraps the global clipboard store)
 */
export function useClipboardStore() {
  const store = clipboardStore
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

  const readAndParseClipboard = async () => {
    const clipboardText = await readFromClipboard()
    const parsed = deserializeClipboard(clipboardText, acceptedClipboardSchema)
    return { clipboardText, parsed }
  }

  // Note: use getPayloadType + openPreviewModal to determine how to show previews

  // Determine payload type by looking at the __type discriminator
  const getPayloadType = (
    d: unknown,
  ): 'UnifiedItem' | 'Meal' | 'Recipe' | null => {
    if (d === null || typeof d !== 'object') return null
    if (Array.isArray(d)) {
      return d.length > 0 && typeof d[0] === 'object'
        ? ((d[0] as any).__type ?? null)
        : null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (d as any).__type ?? null
  }

  const openPreviewModal = (payload: unknown, clipboardText: string) => {
    const type = getPayloadType(payload)

    // If payload contains items (Meal, Recipe or array of Items), render ItemListView
    if (type === 'UnifiedItem' || type === 'Meal' || type === 'Recipe') {
      let itemsArray: Item[] = []
      if (Array.isArray(payload)) {
        itemsArray = payload as Item[]
      } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (payload as any).items &&
        Array.isArray((payload as any).items)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        itemsArray = (payload as any).items
      } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (payload as any).__type === 'UnifiedItem'
      ) {
        itemsArray = [payload as Item]
      }

      try {
        const validated = itemSchema.array().parse(itemsArray)
        const [itemsSignal] = createSignal(validated)

        const modalId = openContentModal(
          () => (
            <div>
              <div class="mb-4">{`Os seguintes itens serão colados:`}</div>
              <ItemListView items={itemsSignal} handlers={{}} />
            </div>
          ),
          {
            title: 'Colar itens',
            footer: () => (
              <div class="flex gap-2 justify-end">
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    closeModal(modalId)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  onClick={() => {
                    processClipboardText(clipboardText)
                      .finally(() => closeModal(modalId))
                      .catch((err) => {
                        showError(`Erro ao colar itens: ${JSON.stringify(err)}`)
                      })
                  }}
                >
                  Colar
                </button>
              </div>
            ),
            closeOnOutsideClick: false,
            closeOnEscape: true,
            showCloseButton: true,
          },
        )

        return
      } catch (err) {
        // validation failed - fallthrough to default confirm modal
        logging.warn(
          'Preview validation failed, falling back to confirm modal',
          {
            error: err instanceof Error ? err.message : String(err),
          },
        )
      }
    }

    // Fallback: simple confirmation when we cannot preview
    openConfirmModal('Tem certeza que deseja colar os itens?', {
      title: 'Colar itens',
      confirmText: 'Colar',
      cancelText: 'Cancelar',
      onConfirm: () => readFromClipboard().then(processClipboardText),
    })
  }

  const handlePaste = async () => {
    try {
      const { clipboardText, parsed } = await readAndParseClipboard()

      if (parsed !== null) {
        openPreviewModal(parsed, clipboardText)
        return
      }

      showError('O conteúdo da área de transferência não pôde ser processado.')
      openConfirmModal('Tem certeza que deseja colar os itens?', {
        title: 'Colar itens',
        confirmText: 'Colar',
        cancelText: 'Cancelar',
        onConfirm: () => readFromClipboard().then(processClipboardText),
      })
    } catch (_err) {
      openConfirmModal('Tem certeza que deseja colar os itens?', {
        title: 'Colar itens',
        confirmText: 'Colar',
        cancelText: 'Cancelar',
        onConfirm: () => readFromClipboard().then(processClipboardText),
      })
    }
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
